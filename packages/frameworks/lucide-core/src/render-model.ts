import { resolveOptimizedPathData, normalizeRenderMode, normalizeShape } from './pixel-path.ts';
import { resolvePixelGeometry } from './pixel-stroke.ts';
import type { IconRenderModel, IconRenderModelOptions } from './types.ts';

export function resolveIconRenderModel(options: IconRenderModelOptions): IconRenderModel {
  const pixelGeometry = resolvePixelGeometry(options);
  const normalizedShape = normalizeShape(options.shape);
  const normalizedRenderMode = normalizeRenderMode(options.renderMode);
  const roundedCornerRadius = Number(Math.min(0.24, Math.max(0, pixelGeometry.pixelSize / 2)).toFixed(3));
  const optimizedPathData = resolveOptimizedPathData({
    iconPixels: options.iconPixels,
    iconRects: options.iconRects,
    shape: normalizedShape,
    pixelSize: pixelGeometry.pixelSize,
    pixelInset: pixelGeometry.pixelInset
  });
  const canRenderOptimized = optimizedPathData !== null;
  const shouldRenderOptimized = normalizedRenderMode !== 'raw' && canRenderOptimized;

  return {
    pixelSize: pixelGeometry.pixelSize,
    pixelInset: pixelGeometry.pixelInset,
    roundedCornerRadius,
    normalizedShape,
    normalizedRenderMode,
    optimizedPathData,
    canRenderOptimized,
    shouldRenderOptimized
  };
}
