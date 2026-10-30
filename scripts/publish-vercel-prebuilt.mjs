import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  assertReleaseInputs,
  releaseArguments,
  updateRelease,
} from "./build-source-release.ts";
import {
  inspectedIdentity,
  releaseSchema,
} from "./build-source-release-schema.ts";

const DEADLINE_MS = 7 * 60 * 1000;
const CLEANUP_MS = 45 * 1000;
const SCOPE = "danielhowells";
const startedAt = Date.now();
let deploymentId;
let deploymentUrl;
let child;
let terminating = false;
let options;
let evidence;
let promoted = false;

class TimeoutError extends Error {}
const remaining = () => Math.max(0, DEADLINE_MS - (Date.now() - startedAt));
const run = (args, timeoutMs, relay = false) =>
  new Promise((resolve, reject) => {
    const command = spawn("vercel", ["--scope", SCOPE, ...args], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child = command;
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      command.kill("SIGTERM");
      setTimeout(() => command.kill("SIGKILL"), 3_000).unref();
    }, timeoutMs);
    command.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (relay) process.stdout.write(text);
    });
    command.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (relay) process.stderr.write(text);
    });
    command.on("error", reject);
    command.on("close", (code) => {
      clearTimeout(timer);
      if (child === command) child = undefined;
      if (timedOut)
        return reject(
          new TimeoutError(`vercel ${args[0]} exceeded its deadline`)
        );
      if (code !== 0)
        return reject(new Error(`vercel ${args[0]} failed: ${stderr.trim()}`));
      resolve({ stdout, stderr });
    });
  });
const json = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} did not return JSON: ${error.message}`);
  }
};
const request = async (path) => {
  const response = await run(
    [
      "curl",
      "--deployment",
      deploymentId,
      path,
      "--",
      "--fail-with-body",
      "--silent",
      "--show-error",
    ],
    remaining()
  );
  return response.stdout;
};
const remove = async (reason) => {
  if (!deploymentId && deploymentUrl) {
    const inspected = json(
      (
        await run(
          ["inspect", deploymentUrl, "--json", "--no-color"],
          CLEANUP_MS
        )
      ).stdout,
      "cleanup inspection"
    );
    deploymentId = inspectedIdentity(inspected, deploymentUrl).id;
  }
  if (!deploymentId) {
    process.stderr.write(`${reason}; no exact deployment exists to remove\n`);
    return;
  }
  const exactId = deploymentId;
  process.stderr.write(`${reason}; removing exact deployment ${exactId}\n`);
  await run(
    ["remove", exactId, "--safe", "--yes", "--no-color"],
    CLEANUP_MS,
    true
  );
  deploymentId = undefined;
};
const stop = async (signal) => {
  if (terminating) return;
  terminating = true;
  child?.kill("SIGTERM");
  try {
    if (!promoted) await remove(`received ${signal}`);
  } finally {
    process.exit(1);
  }
};
process.on("SIGINT", () => void stop("SIGINT"));
process.on("SIGTERM", () => void stop("SIGTERM"));

try {
  options = releaseArguments();
  const checked = execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL("./check-vercel-prebuilt.mjs", import.meta.url)),
      ...process.argv.slice(2),
      "--check",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  evidence = releaseSchema.parse(
    json(checked.trim().split("\n").at(-1), "prebuilt receipt")
  );
  const expectedSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (expectedSha !== evidence.source.baseCommit) {
    throw new Error("runtime verification requires the captured source Git SHA");
  }
  const submitted = await run(
    [
      "deploy",
      "--prebuilt",
      "--prod",
      "--skip-domain",
      "--yes",
      "--no-wait",
      "--no-color",
    ],
    remaining(),
    true
  );
  deploymentUrl = `${submitted.stdout}\n${submitted.stderr}`.match(
    /https:\/\/[a-z0-9-]+\.vercel\.app\b/iu
  )?.[0];
  if (!deploymentUrl)
    throw new Error("Vercel did not report the immutable deployment URL");
  const initial = json(
    (await run(["inspect", deploymentUrl, "--json", "--no-color"], remaining()))
      .stdout,
    "initial inspection"
  );
  deploymentId = inspectedIdentity(initial, deploymentUrl).id;
  evidence = updateRelease(options, evidence, {
    deployment: { id: deploymentId, url: deploymentUrl },
  });
  const readySeconds = Math.floor(remaining() / 1000);
  const ready = json(
    (
      await run(
        [
          "inspect",
          deploymentId,
          "--wait",
          "--timeout",
          `${readySeconds}s`,
          "--json",
          "--no-color",
        ],
        remaining()
      )
    ).stdout,
    "final inspection"
  );
  inspectedIdentity(ready, deploymentUrl, deploymentId);
  if (ready.id !== deploymentId || ready.readyState !== "READY") {
    throw new Error(
      `${deploymentId} finished in ${JSON.stringify(ready.readyState)}`
    );
  }
  const version = json(
    await request(
      `/api/internal/version?expected=${encodeURIComponent(expectedSha)}`
    ),
    "version probe"
  );
  if (version.sha !== expectedSha) {
    throw new Error(
      `${deploymentId} reports ${JSON.stringify(version.sha)}, expected ${expectedSha}`
    );
  }
  const homepage = await request("/");
  if (!homepage.includes("Scaffold")) {
    throw new Error(`${deploymentId} failed the Scaffold homepage probe`);
  }
  assertReleaseInputs(options, evidence);
  evidence = updateRelease(options, evidence, {
    checks: { acceptance: true, ready: true, revision: true },
    status: "deployment-verified",
  });
  const promotionSeconds = Math.floor(remaining() / 1000);
  if (promotionSeconds < 1)
    throw new TimeoutError("deadline reached before promotion");
  await run(
    [
      "promote",
      deploymentId,
      "--yes",
      "--timeout",
      `${promotionSeconds}s`,
      "--no-color",
    ],
    remaining(),
    true
  );
  promoted = true;
  evidence = updateRelease(options, evidence, { status: "promoted" });
  process.stdout.write(
    `${deploymentId} READY, runtime-verified, and promoted (${deploymentUrl})\n`
  );
} catch (error) {
  if (evidence && options && !promoted) {
    try {
      evidence = updateRelease(options, evidence, { status: "failed" });
    } catch (receiptError) {
      process.stderr.write(`failure receipt could not be saved: ${receiptError.message}\n`);
    }
  }
  if (!promoted && (deploymentUrl || deploymentId)) {
    try {
      await remove(
        error instanceof TimeoutError || remaining() === 0
          ? "seven-minute deadline reached"
          : "publish failed before promotion completed"
      );
    } catch (cleanupError) {
      process.stderr.write(`exact deployment cleanup rejected: ${cleanupError.message}\n`);
    }
  }
  throw error;
}
