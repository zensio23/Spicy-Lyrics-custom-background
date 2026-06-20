import path from "node:path";
import {
  buildCustomLayerPatch,
  defaultPatchPath,
  loadManifest,
  parseArgs,
  printHeader,
} from "./upstream-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();
  const baseRef = String(args.base ?? manifest.upstream.trackedRef);
  const outputPath = args.output
    ? path.resolve(process.cwd(), String(args.output))
    : defaultPatchPath;

  const patchPath = await buildCustomLayerPatch({
    baseRef,
    manifest,
    outputPath,
  });

  if (!args.quiet) {
    printHeader("Custom Layer Patch");
    console.log(`Base ref: ${baseRef}`);
    console.log(`Patch written to: ${patchPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
