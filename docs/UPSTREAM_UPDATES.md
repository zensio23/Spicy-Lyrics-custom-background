# Upstream Updates

This branch is kept update-friendly by treating the visualizer work as a custom layer on top of the official Spicy Lyrics upstream repository.

## What is tracked

- Upstream source of truth: `upstream` remote -> `https://github.com/Spikerko/spicy-lyrics.git`
- Custom layer manifest: `custom/upstream-layer.json`
- Rebuildable patch bundle: `custom/patches/spicy-lyrics-custom-layer.patch`

The manifest separates:

- `ignoredDirtyFiles`: local workspace/meta files that should never block upstream updates
- `ownedFiles`: new custom files that belong entirely to this branch
- `patchedUpstreamFiles`: upstream files that intentionally diverge
- `generatedArtifacts`: rebuildable files such as the exported custom patch bundle

## Settings safety

User settings are stored in Spicetify LocalStorage, not in git.

This custom branch also keeps migrations non-destructive:

- missing defaults are filled in
- existing visualizer settings are preserved
- the settings blob is not reset on schema bumps

## Quick Workflow

1. Check whether upstream released something newer:

```bash
bun run upstream:check
```

2. When a newer upstream tag exists, build a fresh custom branch on top of it:

```bash
bun run upstream:update
```

That command:

- refreshes the custom patch bundle first
- fetches upstream tags
- creates a fresh branch from the newest upstream ref
- reapplies the custom layer patch
- updates `custom/upstream-layer.json`
- regenerates the patch against the new upstream base

Default output branches look like:

```text
codex/upstream-6.0.1-custom
```

3. Review and test:

```bash
git status
bun run build
```

4. Install/update inside Spicetify as usual:

```bash
install-spicy-lyrics.bat
```

Or run the all-in-one Windows workflow:

```bash
update-from-upstream.bat
```

That helper:

- tries the upstream update flow first
- rebuilds the local custom bundle with Bun
- copies the local `spicy-lyrics.js` plus the local `spicy-lyrics.mjs` bridge into Spicetify
- runs `spicetify apply`
- pauses at the end so errors stay visible

## Optional Commands

Export the current patch bundle manually:

```bash
bun run upstream:export-patch
```

Apply the patch bundle onto a clean upstream checkout manually:

```bash
bun run upstream:apply
```

Dry-run the updater without switching branches:

```bash
bun run upstream:update -- --dry-run
```

Target a specific upstream tag or branch:

```bash
bun run upstream:update -- --ref 6.0.0
```

## Important Notes

- `upstream:update` expects a clean working tree after the patch export step. If the tree is dirty, it stops safely and keeps the refreshed patch file.
- The generated patch file itself does not block `upstream:update`; only real local source changes do.
- Existing Spicy Lyrics runtime update notices can still tell you when upstream is newer. The scripts here are the branch-safe way to adopt those releases without manually redoing the visualizer work.
- If git reports conflicts while applying the patch onto a newer upstream version, resolve them on the fresh update branch instead of editing the old branch in place.
