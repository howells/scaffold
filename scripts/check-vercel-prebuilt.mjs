import {
  closeSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const outputDir = ".vercel/output";
const config = JSON.parse(readFileSync(`${outputDir}/config.json`, "utf8"));
if (config.version !== 3) {
  throw new Error(
    `expected Build Output API v3, received ${JSON.stringify(config.version)}`
  );
}

const functionConfigs = [];
const nativeBinaries = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const file =
      entry.isFile() || (entry.isSymbolicLink() && statSync(path).isFile());
    if (entry.isDirectory()) walk(path);
    if (file && entry.name === ".vc-config.json") functionConfigs.push(path);
    if (file && entry.name.endsWith(".node")) nativeBinaries.push(path);
  }
};
walk(outputDir);

if (functionConfigs.length === 0)
  throw new Error("artifact contains no function configs");
let hasLinuxSharpTrace = false;
for (const path of functionConfigs) {
  const functionConfig = JSON.parse(readFileSync(path, "utf8"));
  if (functionConfig.architecture !== "x86_64")
    throw new Error(`${path} is not x86_64`);
  const tracedPaths = Object.keys(functionConfig.filePathMap ?? {});
  const darwinTrace = tracedPaths.find((tracedPath) =>
    tracedPath.includes("darwin")
  );
  if (darwinTrace)
    throw new Error(`macOS trace reached the artifact: ${darwinTrace}`);
  hasLinuxSharpTrace ||= tracedPaths.some((tracedPath) =>
    tracedPath.includes("@img+sharp-linux-x64")
  );
}
if (!hasLinuxSharpTrace)
  throw new Error("Linux x64 sharp was not traced into a function");
if (nativeBinaries.length === 0)
  throw new Error("artifact contains no native .node binaries");

for (const path of nativeBinaries) {
  const header = Buffer.alloc(20);
  const descriptor = openSync(path, "r");
  try {
    readSync(descriptor, header, 0, header.length, 0);
  } finally {
    closeSync(descriptor);
  }
  const isElf64 =
    header.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) &&
    header[4] === 2;
  if (!isElf64 || header.readUInt16LE(18) !== 62) {
    throw new Error(`${path} is not Linux ELF64 x86-64`);
  }
}
process.stdout.write(
  `Build Output API v3; ${functionConfigs.length} x86_64 functions; ${nativeBinaries.length} Linux ELF64 x86-64 native binaries\n`
);
