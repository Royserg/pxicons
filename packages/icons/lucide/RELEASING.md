# Releasing `@pxicons/lucide`

## Prerequisites

- From repo root, run `vp install`.
- Ensure npm auth for `@pxicons` is ready.

## Validate

From `packages/icons/lucide`:

```bash
vp run generate
vp run test
```

## Dry Run

```bash
vp pm publish -- --dry-run --no-git-checks
```

## Publish

```bash
vp pm publish -- --no-git-checks
```
