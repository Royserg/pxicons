/// <reference path="./raw-svg.d.ts" />

import { iconManifest } from './icon-manifest';
import { lucidePixelMap } from './pixel-map';
export { lucidePixelMap };
export type { PixelCell } from './pixel-map';

const rawSvgModules = import.meta.glob('../*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

export type PixelShape = 'square' | 'circle' | 'rounded';

export interface PixelIcon {
  id: string;
  library: 'lucide';
  name: string;
  tags: readonly string[];
  viewBox: string;
  svg: string;
}

function pathToIconId(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1] ?? '';
  return fileName.replace(/\.svg$/i, '');
}

function extractViewBox(svg: string): string {
  const match = svg.match(/viewBox="([^"]+)"/i);
  return match?.[1] ?? '0 0 24 24';
}

export const lucideSvgMap: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(rawSvgModules).map(([filePath, svgSource]) => [pathToIconId(filePath), svgSource])
  )
);

export const settingsSvg = lucideSvgMap.settings ?? '';

export const lucideIcons: readonly PixelIcon[] = Object.freeze(
  iconManifest
    .map((entry) => {
      const svg = lucideSvgMap[entry.id];

      if (!svg) {
        return null;
      }

      return {
        id: entry.id,
        library: 'lucide',
        name: entry.name,
        tags: entry.tags,
        viewBox: extractViewBox(svg),
        svg
      } as PixelIcon;
    })
    .filter((entry): entry is PixelIcon => entry !== null)
);

export function getLucideIcon(id: string): PixelIcon | undefined {
  return lucideIcons.find((icon) => icon.id === id);
}
