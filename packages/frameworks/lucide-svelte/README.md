# @pxicons/lucide-svelte

Pixel-art Lucide icon components for Svelte.

## Usage

```svelte
<script>
  import { Settings } from '@pxicons/lucide-svelte';
</script>

<Settings size={24} color="currentColor" />
```

## Pixel Rendering Props

```svelte
<Settings
  shape="rounded"
  pixelGap={0.12}
  renderMode="optimized"
  strokeWidth={2}
/>
```

- `shape`: `'square' | 'circle' | 'rounded'`
- `pixelGap`: `0..0.95` (in grid-cell units)
- `renderMode`: `'auto' | 'raw' | 'optimized'`
