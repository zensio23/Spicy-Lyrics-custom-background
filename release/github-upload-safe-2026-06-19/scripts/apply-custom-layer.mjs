import path from "node:path";
import {
  defaultPatchPath,
  loadManifest,
  parseArgs,
  printHeader,
  repoRoot,
  runGit,
} from "./upstream-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();
  const patchPath = path.resolve(
    process.cwd(),
    String(args.patch ?? defaultPatchPath)
  );

  printHeader("Applying Custom Layer");
  console.log(`Patch: ${patchPath}`);
  console.log(`Repo: ${repoRoot}`);

  runGit([
    "apply",
    "--3way",
    "--whitespace=nowarn",
    "--directory=.",
    patchPath,
  ]);

  console.log(
    `Custom layer applied on top of ${manifest.upstream.trackedRef}. Review the working tree, then build/install as usual.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
