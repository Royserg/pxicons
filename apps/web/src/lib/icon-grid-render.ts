import type { PixelShape } from '@pxicons/lucide';
import type { SvgCustomizationOptions } from './icon-svg';

const GRID_SHAPE: PixelShape = 'square';
const GRID_PIXEL_GAP = 0;
const GRID_SIZE = 24;
const GRID_COLOR = '#d6d6d9';

export function buildGridSvgOptions(): SvgCustomizationOptions {
	return {
		color: GRID_COLOR,
		size: GRID_SIZE,
		padding: 0,
		pixelGap: GRID_PIXEL_GAP,
		backgroundColor: '',
		shape: GRID_SHAPE,
		scope: 'grid'
	};
}
