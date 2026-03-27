import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';
import {
  buildRectRunsFromPixelCells,
  extractPixelCellsFromSvg
} from '../../lucide/svg-geometry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const lucideDir = path.resolve(packageDir, '../lucide');

function evaluateTsModule(source: string, exportName: string) {
  const module = { exports: {} as Record<string, unknown> };
  const context = vm.createContext({ module, exports: module.exports, Object, Array, String, Number, Boolean });
  const script = new vm.Script(`${source}\nmodule.exports = { ${exportName} };`);
  script.runInContext(context);
  return module.exports[exportName];
}

function loadManifestIds(): string[] {
  const manifestPath = path.join(lucideDir, 'src/icon-manifest.ts');
  let source = readFileSync(manifestPath, 'utf8');

  source = source
    .replace(/export interface[\s\S]*?}\n\n/g, '')
    .replace(/export type[^\n]*\n/g, '')
    .replace(/export const iconManifest\s*:[^=]+=/, 'const iconManifest =');

  const manifest = evaluateTsModule(source, 'iconManifest') as Array<{ id: string }>;
  return manifest.map((entry) => entry.id);
}

function readGeneratedIconArrays(iconId: string): { iconPixels: number[][]; iconRects: number[][] } {
  const source = readFileSync(path.join(packageDir, `src/lucide/icons/${iconId}.svelte`), 'utf8');
  const pixelsMatch = source.match(/const iconPixels: IconPixels = (\[[\s\S]*?\]);/);
  const rectsMatch = source.match(/const iconRects: IconRects = (\[[\s\S]*?\]);/);

  if (!pixelsMatch?.[1] || !rectsMatch?.[1]) {
    throw new Error(`Missing generated geometry constants for ${iconId}.`);
  }

  return {
    iconPixels: JSON.parse(pixelsMatch[1]) as number[][],
    iconRects: JSON.parse(rectsMatch[1]) as number[][]
  };
}

function normalizeCells(cells: readonly (readonly [number, number])[]): string[] {
  return [...new Set(cells.map(([x, y]) => `${x},${y}`))].sort();
}

function normalizeRects(rects: readonly (readonly [number, number, number, number])[]): string[] {
  return [...new Set(rects.map(([x, y, width, height]) => `${x},${y},${width},${height}`))].sort();
}

describe('lucide canonical count consistency', () => {
  it('keeps canonical source, manifest, and generated Svelte components in sync', () => {
    const canonicalTags = JSON.parse(
      readFileSync(path.join(lucideDir, 'node_modules/lucide-static/tags.json'), 'utf8')
    ) as Record<string, string[]>;

    const canonicalIds = Object.keys(canonicalTags).sort((a, b) => a.localeCompare(b));
    const manifestIds = loadManifestIds().sort((a, b) => a.localeCompare(b));
    const generatedSvelteIcons = readdirSync(path.join(packageDir, 'src/lucide/icons'))
      .filter((fileName) => fileName.endsWith('.svelte'))
      .map((fileName) => fileName.replace(/\.svelte$/i, ''))
      .sort((a, b) => a.localeCompare(b));

    expect(canonicalIds).toHaveLength(1703);
    expect(manifestIds).toHaveLength(1703);
    expect(generatedSvelteIcons).toHaveLength(1703);

    expect(manifestIds).toEqual(canonicalIds);
    expect(generatedSvelteIcons).toEqual(canonicalIds);
  });

  it('uses canonical replacements and excludes the previous aliases', () => {
    const manifestIds = new Set(loadManifestIds());

    expect(manifestIds.has('house')).toBe(true);
    expect(manifestIds.has('circle-stop')).toBe(true);
    expect(manifestIds.has('lock-open')).toBe(true);

    expect(manifestIds.has('home')).toBe(false);
    expect(manifestIds.has('stop-circle')).toBe(false);
    expect(manifestIds.has('unlock')).toBe(false);
  });

  it('matches generated component geometry to source SVG for representative icons', () => {
    const sampleIds = ['activity', 'settings', 'a-large-small'];

    for (const iconId of sampleIds) {
      const sourceSvg = readFileSync(path.join(lucideDir, `${iconId}.svg`), 'utf8');
      const sourceCells = extractPixelCellsFromSvg(sourceSvg);
      const sourceRects = buildRectRunsFromPixelCells(sourceCells);
      const generated = readGeneratedIconArrays(iconId);

      const generatedCells = generated.iconPixels.map(
        ([x, y]) => [x, y] as const
      );
      const generatedRects = generated.iconRects.map(
        ([x, y, width, height]) => [x, y, width, height] as const
      );

      expect(normalizeCells(generatedCells)).toEqual(normalizeCells(sourceCells));
      expect(normalizeRects(generatedRects)).toEqual(normalizeRects(sourceRects));
    }
  });
});
