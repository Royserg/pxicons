export { normalizeIconName } from './icon-name.ts';
export {
  createCircleSubpath,
  createRoundedSubpath,
  createSquareSubpath,
  normalizeRenderMode,
  normalizeShape,
  resolveOptimizedPathData,
  type OptimizedPathOptions
} from './pixel-path.ts';
export { resolvePixelGeometry } from './pixel-stroke.ts';
export { resolveIconRenderModel } from './render-model.ts';
export { hasA11yProp } from './utils/hasA11yProp.ts';
export type {
  IconPixels,
  IconRects,
  IconRenderMode,
  IconRenderModel,
  IconRenderModelOptions,
  LucideIconDefinition,
  PixelCell,
  PixelGeometry,
  PixelGeometryOptions,
  PixelRect,
  PixelShape
} from './types.ts';
