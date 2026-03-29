import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  normalizeRenderMode,
  normalizeShape,
  resolveOptimizedPathData
} from '../src/lucide/pixel-path.js';
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
    const settingsTemplate = readPackageFile('src/lucide/icons/settings.svelte');

    expect(iconTemplate).toContain('{...props}');
    expect(iconTemplate).toContain('{#if title}');
    expect(iconTemplate).toContain('<title>{title}</title>');
    expect(iconTemplate).toContain('width={size}');
    expect(iconTemplate).toContain('height={size}');
    expect(iconTemplate).toContain("shape = 'square'");
    expect(iconTemplate).toContain("renderMode = 'auto'");
    expect(iconTemplate).toContain('iconRects = []');
    expect(iconTemplate).toContain('<path d={optimizedPathData ?? \'\'} />');

    expect(settingsTemplate).toContain('const iconRects: IconRects =');
    expect(settingsTemplate).toContain('iconRects={iconRects}');
  });
});

describe('@pxicons/lucide-svelte path optimization helpers', () => {
  const iconPixels = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1]
  ] as const;

  const iconRects = [
    [0, 0, 3, 1],
    [0, 1, 1, 1]
  ] as const;

  it('merges square runs when geometry is mergeable', () => {
    const merged = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: 1,
      pixelInset: 0
    });

    expect(merged).toBeTruthy();
    expect(merged?.match(/M/g)?.length ?? 0).toBe(iconRects.length);
  });

  it('uses per-pixel subpaths when geometry is gapped', () => {
    const gapped = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: 0.8,
      pixelInset: 0.1
    });

    expect(gapped).toBeTruthy();
    expect(gapped?.match(/M/g)?.length ?? 0).toBe(iconPixels.length);
  });

  it('uses per-pixel subpaths for non-square shapes', () => {
    const rounded = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'rounded',
      pixelSize: 1,
      pixelInset: 0
    });

    expect(rounded).toBeTruthy();
    expect(rounded?.match(/M/g)?.length ?? 0).toBe(iconPixels.length);
    expect(rounded).toContain('A');
  });

  it('varies path output by shape and geometry key inputs', () => {
    const square = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: 1,
      pixelInset: 0
    });
    const circle = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'circle',
      pixelSize: 1,
      pixelInset: 0
    });
    const squareGapped = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: 0.9,
      pixelInset: 0.05
    });

    expect(square).not.toBe(circle);
    expect(square).not.toBe(squareGapped);
  });

  it('returns null for invalid geometry so auto mode can fall back to raw', () => {
    const invalid = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: Number.NaN,
      pixelInset: 0
    });

    expect(invalid).toBeNull();
  });

  it('normalizes shape and render mode values safely', () => {
    expect(normalizeShape('square')).toBe('square');
    expect(normalizeShape('rounded')).toBe('rounded');
    expect(normalizeShape('circle')).toBe('circle');
    expect(normalizeShape('nope')).toBe('square');

    expect(normalizeRenderMode('auto')).toBe('auto');
    expect(normalizeRenderMode('raw')).toBe('raw');
    expect(normalizeRenderMode('optimized')).toBe('optimized');
    expect(normalizeRenderMode('other')).toBe('auto');
  });
});
