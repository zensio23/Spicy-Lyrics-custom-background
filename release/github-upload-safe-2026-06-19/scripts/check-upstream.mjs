import {
  compareSemver,
  fetchUpstream,
  getBlockingDirtyFiles,
  getCurrentBranch,
  getCurrentHeadCommit,
  getLatestSemverTag,
  getUnmanagedDirtyFiles,
  loadManifest,
  parseArgs,
  printHeader,
  readProjectVersion,
  resolveCommit,
} from "./upstream-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();

  if (!args["no-fetch"]) {
    printHeader("Fetching Upstream");
    fetchUpstream(manifest);
    console.log(`Fetched tags from ${manifest.upstream.remote}.`);
  }

  const currentVersion = await readProjectVersion();
  const latestTag = getLatestSemverTag();
  const trackedCommit = resolveCommit(manifest.upstream.trackedRef);
  const headCommit = getCurrentHeadCommit();
  const unmanagedDirtyFiles = getUnmanagedDirtyFiles(manifest);
  const blockingDirtyFiles = getBlockingDirtyFiles(manifest);

  const report = {
    currentBranch: getCurrentBranch(),
    projectVersion: currentVersion,
    trackedUpstreamRef: manifest.upstream.trackedRef,
    trackedUpstreamCommit: trackedCommit,
    latestUpstreamTag: latestTag,
    headCommit,
    updateAvailable: latestTag ? compareSemver(latestTag, currentVersion) > 0 : false,
    layerIsAheadOfTrackedBase: headCommit !== trackedCommit,
    blockingDirtyFiles,
    unmanagedDirtyFiles,
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHeader("Upstream Status");
  console.log(`Branch: ${report.currentBranch || "(detached HEAD)"}`);
  console.log(`Project version: ${report.projectVersion}`);
  console.log(`Tracked upstream: ${report.trackedUpstreamRef} (${report.trackedUpstreamCommit.slice(0, 7)})`);
  console.log(`Latest upstream tag: ${report.latestUpstreamTag ?? "not found"}`);
  console.log(`Custom layer differs from tracked base: ${report.layerIsAheadOfTrackedBase ? "yes" : "no"}`);
  console.log(`New upstream available: ${report.updateAvailable ? "yes" : "no"}`);
  console.log(`Blocking dirty files: ${report.blockingDirtyFiles.length}`);

  if (report.unmanagedDirtyFiles.length > 0) {
    printHeader("Unmanaged Dirty Files");
    for (const file of report.unmanagedDirtyFiles) {
      console.log(file);
    }
  } else {
    printHeader("Manifest Coverage");
    console.log("All dirty files are covered by custom/upstream-layer.json, including generated patch artifacts.");
  }

  if (report.updateAvailable) {
    printHeader("Next Step");
    console.log("Run `bun run upstream:update` to build a fresh custom branch on top of the latest upstream tag.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
