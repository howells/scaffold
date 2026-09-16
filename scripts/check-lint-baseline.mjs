#!/usr/bin/env node
/**
 * check-lint-baseline.mjs - the lint ratchet.
 *
 * The @howells/lint presets run as published. Turning them on surfaced a
 * backlog, so `pnpm lint` cannot be the push gate until it is cleared. This
 * gate replaces it: it runs everything `pnpm lint` ran, except that Oxlint
 * errors are compared to `scripts/lint-baseline.json` (counts per unit, per
 * rule) instead of having to be zero. A count above its baseline fails; at or
 * below passes, so the backlog can only fall. A rule absent from a unit's map
 * means zero.
 *
 * Also run for every unit, and required to pass outright:
 *   - `howells-oxfmt --check` over the unit's lint targets (formatting is
 *     mechanical, so it is never baselined);
 *   - every other `&&` segment of the unit's own lint script (class scanners,
 *     workspace checks), so no check the old gate ran is lost.
 *
 * Wiring: the root `lint` script runs this gate, so every hook and `pnpm check`
 * that calls `pnpm lint` gets it; `lint:all` keeps the unratcheted full run.
 *
 * `--update` rewrites the baseline. Use it only in a commit whose message
 * says why the baseline moved.
 *
 * Copied from MaterialGraph's gate (2026-09-16), with oxlint run through the
 * @howells/lint wrapper so tsgolint is found in any install layout.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const update = process.argv.includes("--update");
const baselinePath = join(root, "scripts", "lint-baseline.json");

function lintBin(dir, name) {
  const require = createRequire(join(dir, "package.json"));
  return join(
    dirname(require.resolve("@howells/lint/package.json")),
    "bin",
    name
  );
}

// A unit is a directory whose own lint script runs howells-check. Its targets
// are that command's arguments; its other `&&` segments are extra checks.
// At the repo root, `lint` is this gate and `lint:all` holds the full run it
// replaced, so the root unit is read from `lint:all`.
function unitFrom(dir) {
  const manifestPath = join(dir, "package.json");
  if (!existsSync(manifestPath)) return undefined;
  const scripts = JSON.parse(readFileSync(manifestPath, "utf8")).scripts ?? {};
  const lint = (dir === root ? scripts["lint:all"] : scripts.lint) ?? "";
  const segments = lint
    .split("&&")
    .map((s) => s.trim())
    .filter(Boolean);
  const check = segments.find((s) => s.startsWith("howells-check"));
  if (!check) return undefined;
  const targets = check
    .replace(/^howells-check\s*/, "")
    .split(/\s+/)
    .filter((t) => t && !t.startsWith("-"));
  return {
    name: relative(root, dir) || ".",
    dir,
    targets: targets.length > 0 ? targets : ["."],
    extra: segments.filter(
      (s) => s !== check && !s.startsWith("turbo run lint")
    ),
  };
}

function units() {
  const out = [];
  const top = unitFrom(root);
  if (top) out.push(top);
  for (const sub of ["apps", "packages"]) {
    const base = join(root, sub);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base).sort()) {
      const unit = unitFrom(join(base, entry));
      if (unit) out.push(unit);
    }
  }
  return out;
}

function run(cmd, args, cwd) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
}

function countsFor(unit) {
  const result = run(
    "node",
    [lintBin(unit.dir, "howells-oxlint.mjs"), ...unit.targets, "--format=json"],
    unit.dir
  );
  const stdout = result.stdout ?? "";
  const start = stdout.indexOf("{");
  if (start < 0)
    return { broken: result.stderr?.slice(0, 400) || "no output", counts: {} };
  const counts = {};
  for (const f of JSON.parse(stdout.slice(start)).diagnostics ?? []) {
    if (f.severity !== "error") continue;
    counts[f.code] = (counts[f.code] ?? 0) + 1;
  }
  return { broken: undefined, counts };
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : {};
const failures = [];
const measured = [];

for (const unit of units()) {
  const { broken, counts } = countsFor(unit);
  if (broken) {
    failures.push(
      `${unit.name}: oxlint produced no JSON (a measurement failure, not a pass)\n    ${broken}`
    );
    continue;
  }
  measured.push({ unit, counts });
  if (update) continue;

  const format = run(
    "node",
    [lintBin(unit.dir, "howells-oxfmt.mjs"), "--check", ...unit.targets],
    unit.dir
  );
  if (format.status !== 0)
    failures.push(
      `${unit.name}: formatting\n${(format.stdout + format.stderr)
        .trim()
        .split("\n")
        .slice(0, 8)
        .map((l) => `    ${l}`)
        .join("\n")}`
    );

  for (const segment of unit.extra) {
    const extra = spawnSync(segment, {
      cwd: unit.dir,
      shell: true,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${join(unit.dir, "node_modules/.bin")}:${join(root, "node_modules/.bin")}:${process.env.PATH}`,
      },
    });
    if (extra.status !== 0)
      failures.push(
        `${unit.name}: \`${segment}\` failed\n${(extra.stdout + extra.stderr)
          .trim()
          .split("\n")
          .slice(-6)
          .map((l) => `    ${l}`)
          .join("\n")}`
      );
  }

  const allowed = baseline[unit.name] ?? {};
  for (const [code, count] of Object.entries(counts)) {
    if (count > (allowed[code] ?? 0))
      failures.push(
        `${unit.name}: ${code} ${count} > baseline ${allowed[code] ?? 0}`
      );
  }
}

const total = measured.reduce(
  (sum, m) => sum + Object.values(m.counts).reduce((a, b) => a + b, 0),
  0
);

if (update) {
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  const next = {};
  for (const { unit, counts } of measured) {
    const rules = Object.fromEntries(
      Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
    );
    if (Object.keys(rules).length > 0) next[unit.name] = rules;
  }
  writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `lint-baseline.json updated: ${measured.length} units, ${total} findings`
  );
  process.exit(0);
}

if (failures.length > 0) {
  console.error(
    `Lint ratchet failed:\n\n${failures.join("\n")}\n\nFindings may only fall. Fix them, or run \`node scripts/check-lint-baseline.mjs --update\` only in a commit that says why.`
  );
  process.exit(1);
}
console.log(
  `Lint ratchet ok - ${measured.length} units at or under baseline, ${total} findings total.`
);
