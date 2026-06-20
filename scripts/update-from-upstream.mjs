import {
  buildCustomLayerPatch,
  fetchUpstream,
  getBlockingDirtyFiles,
  getCurrentBranch,
  getLatestSemverTag,
  loadManifest,
  parseArgs,
  printHeader,
  resolveCommit,
  sanitizeRefForBranch,
  saveManifest,
  syncProjectConfigVersions,
  runGit,
} from "./upstream-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();

  printHeader("Refreshing Patch");
  const patchPath = await buildCustomLayerPatch({
    baseRef: manifest.upstream.trackedRef,
    manifest,
  });
  console.log(`Exported current custom layer patch to ${patchPath}`);

  const dirtyFiles = getBlockingDirtyFiles(manifest);
  if (dirtyFiles.length > 0) {
    printHeader("Working Tree Not Clean");
    console.log("Commit or stash the current branch, then run this command again.");
    console.log("The patch file was refreshed, so your current custom layer is preserved.");
    for (const file of dirtyFiles) {
      console.log(`- ${file}`);
    }
    process.exitCode = 1;
    return;
  }

  if (!args["no-fetch"]) {
    printHeader("Fetching Upstream");
    fetchUpstream(manifest);
    console.log(`Fetched tags from ${manifest.upstream.remote}.`);
  }

  const targetRef = String(args.ref ?? getLatestSemverTag() ?? `${manifest.upstream.remote}/main`);
  const targetCommit = resolveCommit(targetRef);
  const currentBranch = getCurrentBranch();
  const branchPrefix = String(manifest.upstream.updateBranchPrefix ?? "codex/upstream-");
  const branchName = String(
    args.branch ?? `${branchPrefix}${sanitizeRefForBranch(targetRef)}-custom`
  );

  printHeader("Applying On Fresh Upstream Branch");
  console.log(`Source branch: ${currentBranch || "(detached HEAD)"}`);
  console.log(`Target upstream ref: ${targetRef} (${targetCommit.slice(0, 7)})`);
  console.log(`Output branch: ${branchName}`);

  if (args["dry-run"]) {
    return;
  }

  runGit(["switch", "-C", branchName, targetRef]);
  runGit([
    "apply",
    "--3way",
    "--whitespace=nowarn",
    "--directory=.",
    patchPath,
  ]);

  manifest.upstream.trackedRef = targetRef;
  manifest.upstream.trackedCommit = targetCommit;
  await saveManifest(manifest);

  const semverTarget = targetRef.match(/\d+\.\d+\.\d+/)?.[0];
  if (semverTarget) {
    await syncProjectConfigVersions({
      compatibilityVersion: semverTarget,
      upstreamBaseVersion: semverTarget,
    });
  }

  await buildCustomLayerPatch({
    baseRef: manifest.upstream.trackedRef,
    manifest,
  });

  printHeader("Done");
  console.log(`Custom layer reapplied on ${branchName}.`);
  console.log("Review `git status`, resolve any conflicts if git left markers, then build/install.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
