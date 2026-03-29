export type PixelCell = readonly [number, number];
export type PixelRectRun = readonly [number, number, number, number];

export function extractPixelCellsFromSvg(svgContent: string): readonly PixelCell[];
export function buildRectRunsFromPixelCells(cells: readonly PixelCell[]): readonly PixelRectRun[];
export function extractPixelRectRunsFromSvg(svgContent: string): readonly PixelRectRun[];
