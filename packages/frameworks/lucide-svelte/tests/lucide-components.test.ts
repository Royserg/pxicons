import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { resolvePixelGeometry } from '../src/lucide/pixel-stroke.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');

function readPackageFile(relativePath: string): string {
  return readFileSync(path.join(packageDir, relativePath), 'utf8');
}

describe('@pxicons/lucide-svelte package surface', () => {
  it('declares root, icons, and deep icon subpath exports', () => {
    const packageJson = JSON.parse(readPackageFile('package.json')) as {
      exports?: Record<string, unknown>;
    };

    expect(packageJson.exports).toBeTruthy();
    expect(packageJson.exports).toHaveProperty('.');
    expect(packageJson.exports).toHaveProperty('./icons');
    expect(packageJson.exports).toHaveProperty('./icons/*');
  });

  it('generates named exports for lucide and icons entries', () => {
    const lucideIndex = readPackageFile('src/lucide/index.ts');
    const iconsIndex = readPackageFile('src/lucide/icons/index.ts');
    const settingsDeepEntry = readPackageFile('src/lucide/icons/settings.ts');

    expect(lucideIndex).toContain("export * from './icons/index.js';");
    expect(lucideIndex).toContain("export * as icons from './icons/index.js';");
    expect(iconsIndex).toContain("export { default as Settings } from './settings.svelte';");
    expect(settingsDeepEntry).toContain("export { default } from './settings.svelte';");
  });
});

describe('@pxicons/lucide-svelte stroke mapping', () => {
  it('uses lucide-normalized baseline where strokeWidth=2 maps to 1x pixels', () => {
    const geometry = resolvePixelGeometry({ size: 24, strokeWidth: 2, absoluteStrokeWidth: false });

    expect(geometry.pixelSize).toBe(1);
    expect(geometry.pixelInset).toBe(0);
  });

  it('keeps baseline geometry unchanged when pixelGap is explicitly zero', () => {
    const geometry = resolvePixelGeometry({
      size: 24,
      strokeWidth: 2,
      absoluteStrokeWidth: false,
      pixelGap: 0
    });

    expect(geometry.pixelSize).toBe(1);
    expect(geometry.pixelInset).toBe(0);
  });

  it('reduces pixel size and increases inset when pixelGap is set', () => {
    const gapped = resolvePixelGeometry({
      size: 24,
      strokeWidth: 2,
      absoluteStrokeWidth: false,
      pixelGap: 0.2
    });

    expect(gapped.pixelSize).toBe(0.8);
    expect(gapped.pixelInset).toBe(0.1);
  });

  it('applies stroke width first, then subtracts pixelGap', () => {
    const geometry = resolvePixelGeometry({
      size: 24,
      strokeWidth: 3,
      absoluteStrokeWidth: false,
      pixelGap: 0.25
    });

    expect(geometry.pixelSize).toBe(1.25);
    expect(geometry.pixelInset).toBe(-0.125);
  });

  it('scales pixel size down and up when strokeWidth changes', () => {
    const thinner = resolvePixelGeometry({ size: 24, strokeWidth: 1, absoluteStrokeWidth: false });
    const thicker = resolvePixelGeometry({ size: 24, strokeWidth: 3, absoluteStrokeWidth: false });

    expect(thinner.pixelSize).toBe(0.5);
    expect(thicker.pixelSize).toBe(1.5);
  });

  it('applies absoluteStrokeWidth against numeric icon size', () => {
    const absoluteScaled = resolvePixelGeometry({
      size: 48,
      strokeWidth: 2,
      absoluteStrokeWidth: true
    });

    expect(absoluteScaled.pixelSize).toBe(0.5);
  });

  it('keeps svg passthrough/title hooks in the shared Icon template', () => {
    const iconTemplate = readPackageFile('src/lucide/Icon.svelte');

    expect(iconTemplate).toContain('{...props}');
    expect(iconTemplate).toContain('{#if title}');
    expect(iconTemplate).toContain('<title>{title}</title>');
    expect(iconTemplate).toContain('width={size}');
    expect(iconTemplate).toContain('height={size}');
    expect(iconTemplate).toContain('pixelGap = 0');
  });
});
