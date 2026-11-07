# Fork workflow

This repository is the fork `jjsil/Beanie` (remote `origin`) of
`giladger/Beanie` (remote `upstream`). It ships its own releases and stays in
sync with upstream so changes can go back as PRs. These rules refine the
"commit directly to `main`" rule in CLAUDE.md for fork work.

## Remotes

```bash
git remote add upstream https://github.com/giladger/Beanie.git
git config remote.upstream.tagOpt --no-tags   # keep upstream's vX.Y.Z tags out
git remote set-url --push upstream DISABLED   # never push to upstream by accident
```

Upstream tags stay out because the release script computes the next tag from
local tags, and upstream's `vX.Y.Z` would otherwise collide with fork releases.

## Where commits go

- **Fork-only changes** — manifest `id`/`name`/`author`/`repository`, README fork notes,
  `releaseTagSuffix`, fork release commits, this file: commit on `main`. Keep
  them small and separate so they never mix with upstreamable work.
- **Anything that could become an upstream PR** — branch from `upstream/main`:

  ```bash
  git fetch upstream
  git switch -c feat/<name> upstream/main
  ```

  Commit there, push the branch to `origin`, and open the PR against
  `giladger/Beanie`. Also merge the branch into `main` so the fork gets it
  without waiting for upstream. Never base a PR branch on our `main`: it would
  carry the fork-only commits into the PR.

## Syncing with upstream

On `main`:

```bash
git fetch upstream
git merge upstream/main
```

Merge, never rebase: `main` is pushed, and release tags point into its history.

Conflicts to expect, all mechanical:

| File | Resolution |
|---|---|
| `version` in package.json, package-lock.json, public/manifest.json | Take upstream's plain `X.Y.Z`; the next fork release re-adds the suffix. |
| Top of CHANGELOG.md | Keep both; our `## vX.Y.Z-jj.N` sections go above upstream's. |
| manifest `id`/`name`/`author`/`repository`, README fork notes | Keep ours. |

If upstream squash-merged one of our PRs, resolve its conflicts by taking
upstream's version.

## Releasing

`package.json` sets `"releaseTagSuffix": "jj"`, so `npm run release` tags
`vX.Y.Z-jj.N`: `X.Y.Z` is the upstream version the fork is built on, `N` counts
fork releases on that base and restarts at 1 after merging a new upstream
version. Pass an explicit `X.Y.Z` to override the base.

1. Be on an up-to-date `main` (the script and the release workflow enforce it).
2. Add a `## vX.Y.Z-jj.N - YYYY-MM-DD` section to CHANGELOG.md and commit it.
3. Check with `npm run release -- --dry-run`, then run `npm run release`.

The tag push triggers `.github/workflows/release.yml`, which publishes the
GitHub release that Decaid installs from.

## Skin identity

The fork's skin id is `jjsil-beanie` (manifest `id`), not upstream's `beanie`.
Decaid ships upstream Beanie as a built-in skin: `giladger/Beanie` is listed in
its `skin_sources.json`, and Decaid reinstalls every listed release at each
launch and update check. A fork that reused the id `beanie` would be overwritten
by upstream every time, and would never be updated from this repo. With its own
id, the fork installs next to upstream Beanie and updates from `jjsil/Beanie`.

The gateway settings namespace deliberately stays `beanie`
(`SETTINGS_STORE_NAMESPACE` and the namespace in `src/domain/storage.ts`), so
the fork and upstream Beanie share the same synced settings, alongside the
beans and shots in Decaid's database. Settings keys added only in the fork must
use names upstream doesn't use.

Browser storage (theme, Gemini API key, "scan on this device", the IndexedDB
cache) is separate per skin: Decaid gives each skin id its own stable port, so
each skin has its own origin.
