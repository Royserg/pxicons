import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const lucideDir = path.resolve(packageDir, '../../icons/lucide');

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

function loadPixelMapIds(): string[] {
  const pixelMapPath = path.join(lucideDir, 'src/pixel-map.ts');
  let source = readFileSync(pixelMapPath, 'utf8');

  source = source
    .replace(/export type[^\n]*\n/g, '')
    .replace(/export const lucidePixelMap\s*:[^=]+=/, 'const lucidePixelMap =');

  const pixelMap = evaluateTsModule(source, 'lucidePixelMap') as Record<string, unknown>;
  return Object.keys(pixelMap);
}

describe('lucide canonical count consistency', () => {
  it('keeps canonical source, manifest, pixel-map, and generated Svelte components in sync', () => {
    const canonicalTags = JSON.parse(
      readFileSync(path.join(lucideDir, 'node_modules/lucide-static/tags.json'), 'utf8')
    ) as Record<string, string[]>;

    const canonicalIds = Object.keys(canonicalTags).sort((a, b) => a.localeCompare(b));
    const manifestIds = loadManifestIds().sort((a, b) => a.localeCompare(b));
    const pixelMapIds = loadPixelMapIds().sort((a, b) => a.localeCompare(b));
    const generatedSvelteIcons = readdirSync(path.join(packageDir, 'src/lucide/icons'))
      .filter((fileName) => fileName.endsWith('.svelte'))
      .map((fileName) => fileName.replace(/\.svelte$/i, ''))
      .sort((a, b) => a.localeCompare(b));

    expect(canonicalIds).toHaveLength(1703);
    expect(manifestIds).toHaveLength(1703);
    expect(pixelMapIds).toHaveLength(1703);
    expect(generatedSvelteIcons).toHaveLength(1703);

    expect(manifestIds).toEqual(canonicalIds);
    expect(pixelMapIds).toEqual(canonicalIds);
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
});
