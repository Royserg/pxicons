# pxicons

Pixel-art icons pack.

Website: [pxicons.org](https://pxicons.org)  

The project currently focuses on **pixel-art Lucide icons** and ships framework-specific packages for using them in real applications. The roadmap is to extend the same pipeline to additional icon packs over time.

## Lucide -> Pixel Art

<table>
  <tr>
    <td align="center"><strong>Lucide (Original)</strong></td>
    <td align="center"></td>
    <td align="center"><strong>pxicons (Pixel Art)</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="./docs/images/lucide-search-original.svg" alt="Original Lucide search icon" width="112" /></td>
    <td align="center"><strong>→</strong></td>
    <td align="center"><img src="./packages/frameworks/lucide/search.svg" alt="Pixel-art search icon from pxicons" width="112" /></td>
  </tr>
</table>

## Icon Examples

<table>
  <tr>
    <td align="center"><img src="./packages/frameworks/lucide/activity.svg" alt="activity icon" width="72" /><br /><code>activity</code></td>
    <td align="center"><img src="./packages/frameworks/lucide/badge-check.svg" alt="badge-check icon" width="72" /><br /><code>badge-check</code></td>
    <td align="center"><img src="./packages/frameworks/lucide/bell.svg" alt="bell icon" width="72" /><br /><code>bell</code></td>
  </tr>
  <tr>
    <td align="center"><img src="./packages/frameworks/lucide/house.svg" alt="house icon" width="72" /><br /><code>house</code></td>
    <td align="center"><img src="./packages/frameworks/lucide/search.svg" alt="search icon" width="72" /><br /><code>search</code></td>
    <td align="center"><img src="./packages/frameworks/lucide/settings.svg" alt="settings icon" width="72" /><br /><code>settings</code></td>
  </tr>
</table>

## Supported Frameworks

| Package | Framework / Runtime | Compatibility |
| --- | --- | --- |
| `@pxicons/lucide` | Vanilla JavaScript (DOM) | ESM package for browser-side icon rendering |
| `@pxicons/lucide-react` | React | `react@^18.0.0 \|\| ^19.0.0` |
| `@pxicons/lucide-svelte` | Svelte | `svelte@^5.0.0` |

## Quick Usage

### Vanilla JavaScript

```html
<script type="module">
  import { createIcons } from '@pxicons/lucide';

  createIcons();
</script>

<i data-px="lucide:settings"></i>
```

### React

```tsx
import { Settings } from '@pxicons/lucide-react';

export function App() {
  return <Settings size={24} color="currentColor" />;
}
```

### Svelte

```svelte
<script lang="ts">
  import { Settings } from '@pxicons/lucide-svelte';
</script>

<Settings size={24} color="currentColor" />
```

## Run Locally

Install dependencies:

```bash
vp install
```

Run the main app:

```bash
vp run dev
```

## Report Icon Inconsistencies

If you spot any inconsistency between a Lucide icon and its pixel-art version, please open an issue.

When reporting, include:

- icon name/id
- a short description of what looks inconsistent
- a screenshot (if possible)
