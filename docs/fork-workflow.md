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

- **Fork-only changes** — manifest `author`/`repository`, README fork notes,
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
| manifest `author`/`repository`, README fork notes | Keep ours. |

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

The skin id stays `beanie`. Decaid installs a skin into `web-ui/<id>`, so the
fork replaces upstream Beanie on the tablet and keeps its data: browser storage
is per skin id (each id gets its own stable port), and the gateway store
namespace stays `beanie`. Decaid then updates the skin from whichever repo
installed it last, so reinstalling from `giladger/Beanie` switches back.
