import { describe, expect, it } from 'vite-plus/test';
import { buildGridSvgOptions } from './icon-grid-render';

describe('buildGridSvgOptions', () => {
	it('returns stable grid rendering defaults', () => {
		expect(buildGridSvgOptions()).toEqual({
			color: '#d6d6d9',
			size: 24,
			padding: 0,
			backgroundColor: '',
			shape: 'square',
			scope: 'grid'
		});
	});

	it('returns the same options regardless of repeated calls', () => {
		expect(buildGridSvgOptions()).toEqual(buildGridSvgOptions());
	});
});
