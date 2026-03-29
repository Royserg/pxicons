# Releasing `@pxicons/lucide-react`

## Prerequisites

- From repo root, run `vp install`.
- Ensure npm auth for `@pxicons` is ready.
- Ensure `@pxicons/lucide` for the same release train is already published.

## Validate

From `packages/frameworks/lucide-react`:

```bash
vp run generate
vp run test:consistency
vp run test
vp run build
```

## Dry Run

```bash
vp pm publish -- --dry-run --no-git-checks
```

## Publish

```bash
vp pm publish -- --no-git-checks
```
