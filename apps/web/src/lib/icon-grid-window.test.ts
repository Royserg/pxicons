import { describe, expect, it } from 'vite-plus/test';

import { computeVirtualGridWindow } from './icon-grid-window';

describe('computeVirtualGridWindow', () => {
	it('returns an empty window for an empty dataset', () => {
		const window = computeVirtualGridWindow({
			totalItems: 0,
			columns: 4,
			rowHeight: 96,
			viewportHeight: 640,
			scrollTop: 0
		});

		expect(window).toEqual({
			startIndex: 0,
			endIndex: 0,
			topSpacerHeight: 0,
			bottomSpacerHeight: 0,
			totalRows: 0
		});
	});

	it('calculates start/end indices and spacer heights with overscan', () => {
		const window = computeVirtualGridWindow({
			totalItems: 1703,
			columns: 10,
			rowHeight: 96,
			viewportHeight: 640,
			scrollTop: 960,
			overscanRows: 4
		});

		expect(window.totalRows).toBe(171);
		expect(window.startIndex).toBe(60);
		expect(window.endIndex).toBe(210);
		expect(window.topSpacerHeight).toBe(576);
		expect(window.bottomSpacerHeight).toBe(14400);
	});

	it('clamps end index to totalItems', () => {
		const window = computeVirtualGridWindow({
			totalItems: 15,
			columns: 4,
			rowHeight: 100,
			viewportHeight: 300,
			scrollTop: 1000,
			overscanRows: 2
		});

		expect(window.endIndex).toBe(15);
		expect(window.startIndex).toBeLessThanOrEqual(window.endIndex);
		expect(window.bottomSpacerHeight).toBe(0);
	});
});
