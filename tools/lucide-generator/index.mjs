import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import {
  buildRectRunsFromPixelCells,
  extractPixelCellsFromSvg
} from '../../packages/frameworks/lucide/svg-geometry.mjs';

function evaluateTsModule(source, exportName) {
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, Object, Array, String, Number, Boolean });
  const script = new vm.Script(`${source}\nmodule.exports = { ${exportName} };`);
  script.runInContext(context);
  return module.exports[exportName];
}

export function toPascalCase(iconId) {
  return iconId
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

export function toCamelCase(iconId) {
  const pascal = toPascalCase(iconId);

  if (!pascal) {
    return pascal;
  }

  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function extractViewBox(svg) {
  const match = svg.match(/viewBox="([^"]+)"/i);
  return match?.[1] ?? '0 0 24 24';
}

export async function loadLucideManifest(lucideDir) {
  const manifestPath = path.join(lucideDir, 'src/icon-manifest.ts');
  let source = await fs.readFile(manifestPath, 'utf8');

  source = source
    .replace(/export interface[\s\S]*?}\n\n/g, '')
    .replace(/export type[^\n]*\n/g, '')
    .replace(/export const iconManifest\s*:[^=]+=/, 'const iconManifest =');

  const manifest = evaluateTsModule(source, 'iconManifest');

  if (!Array.isArray(manifest)) {
    throw new Error('Could not parse iconManifest from @pxicons/lucide.');
  }

  return manifest;
}

export async function loadLucideSvgMap(lucideDir) {
  const entries = await fs.readdir(lucideDir, { withFileTypes: true });
  const svgEntries = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.svg'));
  const svgMap = new Map();

  for (const entry of svgEntries) {
    const iconId = entry.name.replace(/\.svg$/i, '');
    const svgContent = await fs.readFile(path.join(lucideDir, entry.name), 'utf8');
    svgMap.set(iconId, svgContent);
  }

  return svgMap;
}

export async function generateLucideEntries(lucideDir) {
  const [manifest, svgMap] = await Promise.all([
    loadLucideManifest(lucideDir),
    loadLucideSvgMap(lucideDir)
  ]);

  const entries = [];
  const seenComponentNames = new Set();
  const seenExportNames = new Set();

  for (const manifestEntry of manifest) {
    const iconId = manifestEntry?.id;

    if (!iconId) {
      continue;
    }

    const sourceSvg = svgMap.get(iconId);

    if (!sourceSvg) {
      throw new Error(`Missing source svg for icon id: ${iconId}`);
    }

    const iconPixels = extractPixelCellsFromSvg(sourceSvg);

    if (iconPixels.length === 0) {
      throw new Error(`Missing pixel geometry for icon id: ${iconId}`);
    }

    const iconRects = buildRectRunsFromPixelCells(iconPixels);
    const componentName = toPascalCase(iconId);
    const exportName = toCamelCase(iconId);

    if (!componentName) {
      throw new Error(`Could not generate component name for icon id: ${iconId}`);
    }

    if (!exportName) {
      throw new Error(`Could not generate export name for icon id: ${iconId}`);
    }

    if (seenComponentNames.has(componentName)) {
      throw new Error(`Duplicate component name generated: ${componentName}`);
    }

    if (seenExportNames.has(exportName)) {
      throw new Error(`Duplicate export name generated: ${exportName}`);
    }

    seenComponentNames.add(componentName);
    seenExportNames.add(exportName);

    entries.push({
      iconId,
      iconName: manifestEntry.name,
      tags: manifestEntry.tags,
      viewBox: extractViewBox(sourceSvg),
      sourceSvg,
      iconPixels,
      iconRects,
      componentName,
      exportName
    });
  }

  return entries;
}
