# @pxicons/lucide

Pixel-art Lucide icons for vanilla JavaScript.

## Install

```bash
npm install @pxicons/lucide
```

## Quick Start (Vanilla)

```html
<script type="module">
  import { createIcons } from '@pxicons/lucide';

  createIcons();
</script>

<i data-px="lucide:alarm-clock-minus"></i>
```

## Runtime API

- `createIcons(options?)`: scans DOM and replaces matching elements with generated SVG.
- `replaceElement(element, icon, options?)`: replace one element with a rendered icon SVG.
- `iconToSvg(icon, options?)`: render icon definition to SVG string.

## Data Attribute

- Default attribute: `data-px`
- Token format: `library:icon`
- Current library support: `lucide`
- Example: `data-px="lucide:alarm-clock-minus"`

`createIcons` accepts tolerant icon naming (`alarm-clock-minus`, `alarmClockMinus`, `AlarmClockMinus`, `alarm_clock_minus`) and normalizes to canonical kebab-case.

## Icon Exports

```ts
import { alarmClockMinus, icons } from '@pxicons/lucide';
```

Deep icon subpath:

```ts
import alarmClockMinus from '@pxicons/lucide/icons/alarm-clock-minus';
```

## Compatibility Exports

Existing exports remain available:

- `lucideIcons`
- `lucideSvgMap`
- `lucidePixelMap`
- `getLucideIcon`
- `extractPixelCellsFromSvg`
- `buildRectRunsFromPixelCells`
- `extractPixelRectRunsFromSvg`
