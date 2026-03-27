import { describe, expect, it } from 'vite-plus/test';

import {
  hasA11yProp,
  normalizeIconName,
  normalizeRenderMode,
  normalizeShape,
  resolveIconRenderModel,
  resolveOptimizedPathData,
  resolvePixelGeometry
} from '../src/index';

describe('@pxicons/lucide-core normalization', () => {
  it('normalizes icon names from multiple case styles', () => {
    expect(normalizeIconName('alarm-clock-minus')).toBe('alarm-clock-minus');
    expect(normalizeIconName('alarmClockMinus')).toBe('alarm-clock-minus');
    expect(normalizeIconName('AlarmClockMinus')).toBe('alarm-clock-minus');
    expect(normalizeIconName('alarm_clock_minus')).toBe('alarm-clock-minus');
    expect(normalizeIconName('')).toBe('');
  });

  it('normalizes shape and render mode with safe fallbacks', () => {
    expect(normalizeShape('square')).toBe('square');
    expect(normalizeShape('circle')).toBe('circle');
    expect(normalizeShape('rounded')).toBe('rounded');
    expect(normalizeShape('triangle')).toBe('square');

    expect(normalizeRenderMode('auto')).toBe('auto');
    expect(normalizeRenderMode('raw')).toBe('raw');
    expect(normalizeRenderMode('optimized')).toBe('optimized');
    expect(normalizeRenderMode('other')).toBe('auto');
  });
});

describe('@pxicons/lucide-core geometry', () => {
  it('resolves pixel geometry with absolute stroke support', () => {
    expect(resolvePixelGeometry({})).toEqual({ pixelSize: 1, pixelInset: 0 });

    const absolute = resolvePixelGeometry({
      size: 48,
      strokeWidth: 2,
      absoluteStrokeWidth: true
    });

    expect(absolute).toEqual({ pixelSize: 0.5, pixelInset: 0.25 });

    const fallback = resolvePixelGeometry({ size: 'bad', strokeWidth: 'bad' });
    expect(fallback).toEqual({ pixelSize: 1, pixelInset: 0 });
  });

  it('creates optimized path data and handles invalid geometry safely', () => {
    const iconPixels = [
      [1, 1],
      [2, 1]
    ] as const;
    const iconRects = [[1, 1, 2, 1]] as const;

    const squarePath = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: 1,
      pixelInset: 0
    });

    expect(squarePath).toBe('M1 1h2v1h-2Z');

    const circlePath = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'circle',
      pixelSize: 1,
      pixelInset: 0
    });

    expect(circlePath).toContain('a0.5 0.5');

    const invalidPath = resolveOptimizedPathData({
      iconPixels,
      iconRects,
      shape: 'square',
      pixelSize: 0,
      pixelInset: 0
    });

    expect(invalidPath).toBeNull();

    const emptyPath = resolveOptimizedPathData({
      iconPixels: [],
      iconRects: [],
      shape: 'square',
      pixelSize: 1,
      pixelInset: 0
    });

    expect(emptyPath).toBe('');
  });
});

describe('@pxicons/lucide-core render model + a11y', () => {
  it('builds render model values with raw mode override', () => {
    const model = resolveIconRenderModel({
      iconPixels: [
        [1, 1],
        [2, 1]
      ],
      iconRects: [[1, 1, 2, 1]],
      renderMode: 'raw',
      shape: 'rounded'
    });

    expect(model.normalizedShape).toBe('rounded');
    expect(model.normalizedRenderMode).toBe('raw');
    expect(model.canRenderOptimized).toBe(true);
    expect(model.shouldRenderOptimized).toBe(false);
  });

  it('detects accessibility props', () => {
    expect(hasA11yProp({})).toBe(false);
    expect(hasA11yProp({ 'aria-label': '' })).toBe(false);
    expect(hasA11yProp({ 'aria-label': 'Icon label' })).toBe(true);
    expect(hasA11yProp({ role: 'img' })).toBe(true);
  });
});
