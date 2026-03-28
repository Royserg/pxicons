# Releasing `@pxicons/lucide`

## Prerequisites

- From repo root, run `vp install`.
- Ensure npm auth for `@pxicons` is ready.
- Optional: ensure JSR auth is ready (`JSR_TOKEN`) if you plan to publish to JSR.

## Validate

From `packages/frameworks/lucide`:

```bash
vp run release:check
```

`release:check` runs generation, tests, and npm dry-run validation.

If you also want to validate the optional JSR path:

```bash
vp run release:check:all
```

## Publish (npm)

```bash
vp run release:npm
```

## Publish (JSR, Optional)

```bash
vp run release:jsr
```
