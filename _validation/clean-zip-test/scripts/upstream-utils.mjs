import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, "..");
export const manifestPath = path.join(repoRoot, "custom", "upstream-layer.json");
export const defaultPatchPath = path.join(
  repoRoot,
  "custom",
  "patches",
  "spicy-lyrics-custom-layer.patch"
);

function normalizeRepoFile(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

function normalizeLineEndings(value) {
  return value.replace(/\r\n/g, "\n");
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.trim();
    if (!key) continue;

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
      continue;
    }

    args[key] = true;
  }
  return args;
}

export function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });

  if ((result.status ?? 1) !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`git ${args.join(" ")} failed${detail ? `\n${detail}` : ""}`);
  }

  return normalizeLineEndings(result.stdout ?? "");
}

export function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });

  if ((result.status ?? 1) !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${detail ? `\n${detail}` : ""}`);
  }

  return normalizeLineEndings(result.stdout ?? "");
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function loadManifest() {
  const raw = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(raw);
}

export async function saveManifest(manifest) {
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export async function readProjectVersion() {
  const configPath = path.join(repoRoot, "project", "config.ts");
  const raw = await fs.readFile(configPath, "utf8");
  const match = raw.match(/ProjectVersion\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error("Could not read ProjectVersion from project/config.ts");
  }
  return match[1];
}

export async function syncProjectConfigVersions({
  compatibilityVersion,
  upstreamBaseVersion,
}) {
  const configPath = path.join(repoRoot, "project", "config.ts");
  const raw = await fs.readFile(configPath, "utf8");
  const nextDisplayVersion = `${compatibilityVersion}-custom`;

  const updated = raw
    .replace(
      /export const ProjectVersion = "([^"]+)";/,
      `export const ProjectVersion = "${compatibilityVersion}";`
    )
    .replace(
      /export const ProjectDisplayVersion = "([^"]+)";/,
      `export const ProjectDisplayVersion = "${nextDisplayVersion}";`
    )
    .replace(
      /export const ProjectCompatibilityVersion = "([^"]+)";/,
      `export const ProjectCompatibilityVersion = "${compatibilityVersion}";`
    )
    .replace(
      /export const ProjectUpstreamBaseVersion = "([^"]+)";/,
      `export const ProjectUpstreamBaseVersion = "${upstreamBaseVersion}";`
    );

  await fs.writeFile(configPath, updated, "utf8");
}

export function parseSemver(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return match.slice(1).map((value) => Number.parseInt(value, 10));
}

export function compareSemver(left, right) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);
  if (!leftParts || !rightParts) {
    return String(left).localeCompare(String(right));
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] === rightParts[index]) continue;
    return leftParts[index] > rightParts[index] ? 1 : -1;
  }
  return 0;
}

export async function fetchUpstream(manifest) {
  runGit(["fetch", manifest.upstream.remote, "--tags"]);
}

export function getCurrentBranch() {
  return runGit(["branch", "--show-current"]).trim();
}

export function getCurrentHeadCommit() {
  return runGit(["rev-parse", "HEAD"]).trim();
}

export function resolveCommit(ref) {
  return runGit(["rev-parse", ref]).trim();
}

export function getLocalTags() {
  return runGit(["tag", "--list", "--sort=-v:refname"])
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function getLatestSemverTag() {
  return getLocalTags().find((tag) => parseSemver(tag) !== null) ?? null;
}

export function getDirtyFiles() {
  return runGit(["status", "--short", "--untracked-files=all"])
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => normalizeRepoFile(line.slice(3)));
}

export function listManagedFiles(manifest) {
  return [
    ...new Set(
      [
        ...(manifest.ignoredDirtyFiles ?? []),
        ...(manifest.generatedArtifacts ?? []),
        ...(manifest.ownedFiles ?? []),
        ...(manifest.patchedUpstreamFiles ?? []),
      ].map(normalizeRepoFile)
    ),
  ];
}

export function listBlockingFiles(manifest) {
  return [
    ...new Set(
      [...(manifest.ownedFiles ?? []), ...(manifest.patchedUpstreamFiles ?? [])].map(
        normalizeRepoFile
      )
    ),
  ];
}

export function getUnmanagedDirtyFiles(manifest) {
  const tracked = new Set(listManagedFiles(manifest));
  return getDirtyFiles().filter((file) => !tracked.has(file));
}

export function getBlockingDirtyFiles(manifest) {
  const ignoredFiles = new Set(
    [...(manifest.generatedArtifacts ?? []), ...(manifest.ignoredDirtyFiles ?? [])].map(
      normalizeRepoFile
    )
  );
  return getDirtyFiles().filter((file) => !ignoredFiles.has(file));
}

export function sanitizeRefForBranch(ref) {
  return ref.replace(/[^A-Za-z0-9._-]+/g, "-");
}

export function printHeader(title) {
  console.log(`\n== ${title} ==`);
}

export async function buildCustomLayerPatch({
  baseRef,
  manifest,
  outputPath = defaultPatchPath,
}) {
  const normalizedOutputPath = path.resolve(outputPath);
  const patchDir = path.dirname(normalizedOutputPath);
  await ensureDir(patchDir);

  const sections = [];

  if (manifest.patchedUpstreamFiles?.length) {
    const trackedDiff = runGit([
      "diff",
      "--binary",
      "--full-index",
      baseRef,
      "--",
      ...manifest.patchedUpstreamFiles,
    ]);
    if (trackedDiff.trim()) {
      sections.push(trackedDiff.trimEnd());
    }
  }

  for (const ownedFile of manifest.ownedFiles ?? []) {
    const diffResult = spawnSync(
      "git",
      ["diff", "--no-index", "--binary", "--full-index", "--", "/dev/null", ownedFile],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: "pipe",
      }
    );

    if ((diffResult.status ?? 0) !== 0 && (diffResult.status ?? 0) !== 1) {
      const detail = [diffResult.stdout, diffResult.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`Failed to diff owned file ${ownedFile}${detail ? `\n${detail}` : ""}`);
    }

    const diffText = normalizeLineEndings(diffResult.stdout ?? "").trimEnd();
    if (diffText) {
      sections.push(diffText);
    }
  }

  const patchText = sections.length > 0 ? `${sections.join("\n\n")}\n` : "";
  await fs.writeFile(normalizedOutputPath, patchText, "utf8");
  return normalizedOutputPath;
}
