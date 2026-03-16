import { describe, expect, it } from 'vite-plus/test';
import { buildGridSvgOptions } from './icon-grid-render';

describe('buildGridSvgOptions', () => {
	it('returns stable grid rendering defaults for unselected icons', () => {
		expect(buildGridSvgOptions(false)).toEqual({
			color: '#d6d6d9',
			size: 24,
			padding: 0,
			pixelGap: 0,
			backgroundColor: '',
			shape: 'square',
			scope: 'grid'
		});
	});

	it('only changes color when icon is selected', () => {
		const selected = buildGridSvgOptions(true);
		const unselected = buildGridSvgOptions(false);

		expect(selected.color).toBe('#fafafa');
		expect(unselected.color).toBe('#d6d6d9');
		expect({ ...selected, color: unselected.color }).toEqual(unselected);
	});
});
