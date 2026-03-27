import { describe, expect, it } from 'vite-plus/test';

import {
	buildRectRunsFromPixelCells,
	extractPixelCellsFromSvg,
	extractPixelRectRunsFromSvg,
	lucidePixelMap,
	lucideSvgMap
} from './index';

describe('svg geometry extraction', () => {
	it('extracts identical cells from legacy rect and canonical use-run SVG', () => {
		const legacyRectSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="3" y="10" width="2" height="1"/>
  <rect x="9" y="14" width="1" height="1"/>
</svg>`;
		const defsUseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges">
  <defs>
    <symbol id="px" viewBox="0 0 1 1" overflow="visible" preserveAspectRatio="none">
      <rect width="1" height="1" />
    </symbol>
  </defs>
  <use href="#px" x="3" y="10" width="2" height="1"/>
  <use href="#px" x="9" y="14" width="1" height="1"/>
</svg>`;

		expect(extractPixelCellsFromSvg(defsUseSvg)).toEqual(extractPixelCellsFromSvg(legacyRectSvg));
		expect(extractPixelCellsFromSvg(defsUseSvg)).toEqual([
			[3, 10],
			[4, 10],
			[9, 14]
		]);
	});

	it('builds run-length rects from extracted cells', () => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <use href="#px" x="2" y="5" width="3" height="1"/>
  <use href="#px" x="7" y="5" width="1" height="1"/>
  <use href="#px" x="2" y="6" width="2" height="1"/>
</svg>`;

		const cells = extractPixelCellsFromSvg(svg);
		const rectsFromCells = buildRectRunsFromPixelCells(cells);
		const rectsFromSvg = extractPixelRectRunsFromSvg(svg);

		expect(rectsFromSvg).toEqual(rectsFromCells);
		expect(rectsFromSvg).toEqual([
			[2, 5, 3, 1],
			[7, 5, 1, 1],
			[2, 6, 2, 1]
		]);
	});
});

describe('@pxicons/lucide derived pixel map', () => {
	it('derives lucidePixelMap from raw SVG content', () => {
		const settingsSvg = lucideSvgMap.settings;
		const derivedSettings = extractPixelCellsFromSvg(settingsSvg ?? '');

		expect(settingsSvg).toBeTruthy();
		expect(lucidePixelMap.settings).toEqual(derivedSettings);
		expect(lucidePixelMap.settings.length).toBeGreaterThan(0);
	});
});
