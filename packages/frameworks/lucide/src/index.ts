/// <reference path="./raw-svg.d.ts" />

import { iconManifest } from './icon-manifest';
import { extractPixelCellsFromSvg } from '../svg-geometry.mjs';
import { iconsById } from './generated/icons/registry.js';

export {
  buildRectRunsFromPixelCells,
  extractPixelCellsFromSvg,
  extractPixelRectRunsFromSvg
} from '../svg-geometry.mjs';
export type { PixelCell, PixelRectRun } from '../svg-geometry.mjs';

import type { LucideIconDefinition, PixelCell, PixelShape } from '@pxicons/lucide/_core';

export type { IconRenderMode, LucideIconDefinition, PixelShape } from '@pxicons/lucide/_core';

export {
  createIcons,
  iconToSvg,
  replaceElement,
  type CreateIconsOptions,
  type CreateIconsResult,
  type IconRenderOptions,
  type ReplaceElementOptions
} from './vanilla.js';

export * from './generated/icons/index.js';
export { icons, iconsById } from './generated/icons/registry.js';

const rawSvgModules = import.meta.glob('../*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

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

export const lucidePixelMap: Readonly<Record<string, readonly PixelCell[]>> = Object.freeze(
  Object.fromEntries(
    iconManifest.map((entry) => {
      const svg = lucideSvgMap[entry.id] ?? '';
      return [entry.id, extractPixelCellsFromSvg(svg)];
    })
  )
);

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

export const lucideIconDefinitions: Readonly<Record<string, LucideIconDefinition>> = Object.freeze(iconsById);

export function getLucideIcon(id: string): PixelIcon | undefined {
  return lucideIcons.find((icon) => icon.id === id);
}

export function getLucideIconDefinition(id: string): LucideIconDefinition | undefined {
  return lucideIconDefinitions[id];
}
