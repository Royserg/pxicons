import type { PixelShape } from '@pxicons/lucide';
import type { SvgCustomizationOptions } from './icon-svg';

const GRID_SHAPE: PixelShape = 'square';
const GRID_PIXEL_GAP = 0;
const GRID_SIZE = 24;

export function buildGridSvgOptions(isSelected: boolean): SvgCustomizationOptions {
	return {
		color: isSelected ? '#fafafa' : '#d6d6d9',
		size: GRID_SIZE,
		padding: 0,
		pixelGap: GRID_PIXEL_GAP,
		backgroundColor: '',
		shape: GRID_SHAPE,
		scope: 'grid'
	};
}
