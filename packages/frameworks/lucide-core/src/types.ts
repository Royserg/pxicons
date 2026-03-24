export type PixelCell = readonly [number, number];
export type PixelRect = readonly [number, number, number, number];
export type IconPixels = readonly PixelCell[];
export type IconRects = readonly PixelRect[];

export type PixelShape = 'square' | 'circle' | 'rounded';
export type IconRenderMode = 'auto' | 'raw' | 'optimized';

export interface PixelGeometryOptions {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

export interface PixelGeometry {
  pixelSize: number;
  pixelInset: number;
}

export interface LucideIconDefinition {
  id: string;
  library: 'lucide';
  name: string;
  tags: readonly string[];
  viewBox: string;
  iconPixels: IconPixels;
  iconRects: IconRects;
}

export interface IconRenderModelOptions extends PixelGeometryOptions {
  iconPixels: IconPixels;
  iconRects: IconRects;
  shape?: PixelShape | string;
  renderMode?: IconRenderMode | string;
}

export interface IconRenderModel {
  pixelSize: number;
  pixelInset: number;
  roundedCornerRadius: number;
  normalizedShape: PixelShape;
  normalizedRenderMode: IconRenderMode;
  optimizedPathData: string | null;
  canRenderOptimized: boolean;
  shouldRenderOptimized: boolean;
}
