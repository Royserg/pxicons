# @pxicons/lucide-react

Pixel-art Lucide icon components for React.

## Install

```bash
npm install @pxicons/lucide-react
```

## Quick Start

```tsx
import { AlarmClockMinus } from '@pxicons/lucide-react';

export function App() {
  return <AlarmClockMinus size={24} color="currentColor" />;
}
```

## Import Patterns

```tsx
import { AlarmClockMinus, Icon, icons } from '@pxicons/lucide-react';
import AlarmClockMinusDeep from '@pxicons/lucide-react/icons/alarm-clock-minus';
```

## Props

All generated icons forward to the shared `Icon` base component.

| Prop | Type | Default |
| --- | --- | --- |
| `size` | `number \| string` | `24` |
| `color` | `string` | `'currentColor'` |
| `strokeWidth` | `number \| string` | `2` |
| `absoluteStrokeWidth` | `boolean` | `false` |
| `shape` | `'square' \| 'circle' \| 'rounded'` | `'square'` |
| `renderMode` | `'auto' \| 'raw' \| 'optimized'` | `'auto'` |
| `title` | `string` | `undefined` |
| `...svgProps` | `React.SVGProps<SVGSVGElement>` | - |

## Accessibility

- If `title` is set, `<title>` is rendered.
- If no `title` and no explicit accessibility props are passed, icons default to `aria-hidden="true"`.
