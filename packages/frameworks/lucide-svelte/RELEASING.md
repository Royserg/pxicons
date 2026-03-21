# Releasing `@pxicons/lucide-svelte`

This package is published to npm first, with a required JSR dry-run gate before npm publish.

## Prerequisites

- Run `vp install` from the monorepo root.
- Ensure npm auth is ready for the `@pxicons` scope.
- Ensure JSR auth is ready (`JSR_TOKEN` or interactive login for `jsr publish`).

## Local Release Commands

From `packages/frameworks/lucide-svelte`:

1. Validate everything (required):

   ```bash
   vp run release:check
   ```

   This runs:
   - build, tests, and `jsr.json` sync
   - npm publish dry-run
   - JSR publish dry-run

2. Publish to npm:

   ```bash
   vp run release:npm
   ```

3. Publish to JSR:

   ```bash
   vp run release:jsr
   ```

## JSR Wildcard Exports

JSR currently rejects wildcard export entries such as `./icons/*`.
The `sync:jsr` script therefore omits wildcard subpath exports by default and keeps only `.` and `./icons`.

JSR also currently rejects this package's `.svelte` module graph during `jsr publish --dry-run`.
With the current release policy, `release:check` and `release:npm` will stay blocked until JSR supports `.svelte` modules or the JSR entrypoints are redesigned.

If wildcard support is added in the future and you want to test it, regenerate `jsr.json` with:

```bash
PXICONS_JSR_ALLOW_WILDCARD=1 vp run sync:jsr
```

Then validate with:

```bash
vp run release:check
```
