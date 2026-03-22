# Releasing `@pxicons/lucide-svelte`

This package uses a coupled release policy: npm publish is blocked unless the JSR dry-run gate passes.

The package now ships two build artifacts during release validation:

- `dist/` for npm package contents
- `dist-jsr/` for JSR runtime exports (no `.svelte` modules in exported JS graph)

## Prerequisites

- Run `vp install` from the monorepo root.
- Ensure npm auth is ready for the `@pxicons` scope.
- Ensure JSR auth is ready (`JSR_TOKEN` or interactive login for `jsr publish`).

Optional quick checks:

```bash
vp pm whoami
printenv JSR_TOKEN | wc -c
```

## Local Release Commands

From `packages/frameworks/lucide-svelte`:

1. Validate everything (required):

   ```bash
   vp run release:check
   ```

   This runs:
   - `build` (`dist/`) and `build:jsr` (`dist-jsr/`)
   - tests
   - `jsr.json` sync
   - npm publish dry-run
   - JSR publish dry-run

2. Publish to npm (coupled gate enforced):

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

If wildcard support is added in the future and you want to test it, regenerate `jsr.json` with:

```bash
PXICONS_JSR_ALLOW_WILDCARD=1 vp run sync:jsr
```

Then validate with:

```bash
vp run release:check
```

## Registry Verification

After publish, verify both registries:

```bash
vp info @pxicons/lucide-svelte
vp dlx -- jsr info @pxicons/lucide-svelte
```
