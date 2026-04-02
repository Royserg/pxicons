# @pxicons/lucide-svelte

Pixel-art Lucide icon components for Svelte.

## Install

```bash
npm install @pxicons/lucide-svelte
```

```bash
deno add jsr:@pxicons/lucide-svelte
```

## Compatibility

- `svelte@^5`

## Quick Start

```svelte
<script lang="ts">
  import { Settings } from '@pxicons/lucide-svelte';
</script>

<Settings size={24} color="currentColor" />
```

## Import Patterns

```svelte
<script lang="ts">
  import { Settings } from '@pxicons/lucide-svelte';
  import { Settings as SettingsFromIcons } from '@pxicons/lucide-svelte/icons';
  import { icons } from '@pxicons/lucide-svelte';
</script>
```

## Props

All icons share the same API:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `number \| string` | `24` | Sets SVG `width` and `height`. |
| `color` | `string` | `'currentColor'` | Fill color for generated pixel geometry. |
| `strokeWidth` | `number \| string` | `2` | Controls pixel density/weight. |
| `absoluteStrokeWidth` | `boolean` | `false` | Keeps stroke appearance consistent when size scales. |
| `shape` | `'square' \| 'circle' \| 'rounded'` | `'square'` | Pixel glyph style. |
| `renderMode` | `'auto' \| 'raw' \| 'optimized'` | `'auto'` | Chooses per-pixel vs optimized path rendering. |
| `title` | `string` | `undefined` | Adds a `<title>` for accessibility. |
| `...props` | `SVGAttributes<SVGSVGElement>` | - | Forwarded to the root `<svg>`. |

## Render Behavior

- `renderMode="auto"` picks optimized output when geometry is safe, otherwise raw per-pixel elements.
- `renderMode="optimized"` forces path-based rendering when possible.
- `renderMode="raw"` always renders per-pixel elements.
- `shape="square"` is grid-sharp.
- `shape="circle"` renders circular pixels.
- `shape="rounded"` renders rounded-corner pixels.

## Accessibility

- If `title` is provided, a `<title>` node is rendered.
- If no `title`, no children, and no explicit accessibility attributes are passed, the icon is marked `aria-hidden="true"`.

## Links

- Docs: [pxicons.org/packages/lucide-svelte](https://pxicons.org/packages/lucide-svelte)
- npm: [@pxicons/lucide-svelte](https://www.npmjs.com/package/@pxicons/lucide-svelte)
- JSR: [@pxicons/lucide-svelte](https://jsr.io/@pxicons/lucide-svelte)
- Icon catalog: [pxicons.org/icons](https://pxicons.org/icons)
- Release guide: [`RELEASING.md`](./RELEASING.md)
