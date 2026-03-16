import { describe, expect, it } from 'vite-plus/test';
import { getIconRowBounds, getIconRowCount, getIconsForRow } from './icon-grid-rows';

describe('icon row virtualization helpers', () => {
	it('computes row counts for empty, full, and partial grids', () => {
		expect(getIconRowCount(0, 4)).toBe(0);
		expect(getIconRowCount(12, 4)).toBe(3);
		expect(getIconRowCount(13, 4)).toBe(4);
	});

	it('clamps invalid columns and totals safely', () => {
		expect(getIconRowCount(10, 0)).toBe(10);
		expect(getIconRowCount(-5, 4)).toBe(0);
		expect(getIconRowCount(Number.NaN, 4)).toBe(0);
	});

	it('returns row bounds for normal and partial last rows', () => {
		expect(getIconRowBounds(10, 4, 0)).toEqual({ startIndex: 0, endIndex: 4 });
		expect(getIconRowBounds(10, 4, 1)).toEqual({ startIndex: 4, endIndex: 8 });
		expect(getIconRowBounds(10, 4, 2)).toEqual({ startIndex: 8, endIndex: 10 });
	});

	it('returns empty bounds for out-of-range rows', () => {
		expect(getIconRowBounds(10, 4, -1)).toEqual({ startIndex: 0, endIndex: 0 });
		expect(getIconRowBounds(10, 4, 3)).toEqual({ startIndex: 0, endIndex: 0 });
	});

	it('slices row items correctly', () => {
		const icons = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

		expect(getIconsForRow(icons, 3, 0)).toEqual(['a', 'b', 'c']);
		expect(getIconsForRow(icons, 3, 1)).toEqual(['d', 'e', 'f']);
		expect(getIconsForRow(icons, 3, 2)).toEqual(['g']);
		expect(getIconsForRow(icons, 3, 5)).toEqual([]);
	});
});
