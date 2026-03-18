// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import { getLucideIcon } from '@pxicons/lucide';
import { buildExportSvg } from './icon-svg';
import {
	buildSvgInspectionModel,
	findSvgMapEntryByOffset,
	normalizeSvgMarkup
} from './svg-inspector';

const settingsIcon = getLucideIcon('settings');

if (!settingsIcon) {
	throw new Error('Expected settings icon fixture to exist');
}

describe('svg-inspector', () => {
	it('builds stable drawable entries for generated raw SVG output', () => {
		const rawSvg = buildExportSvg(
			settingsIcon,
			{
				color: 'currentColor',
				size: 96,
				padding: 0,
				shape: 'square'
			},
			'raw'
		);

		const firstModel = buildSvgInspectionModel(rawSvg);
		const secondModel = buildSvgInspectionModel(rawSvg);

		expect(firstModel.status).toBe('ready');
		expect(secondModel.status).toBe('ready');
		expect(firstModel.entries.length).toBeGreaterThan(0);
		expect(firstModel.entries.length).toBe(secondModel.entries.length);
		expect(firstModel.entries.map((entry) => entry.id)).toEqual(
			secondModel.entries.map((entry) => entry.id)
		);
	});

	it('maps representative drawable tags and injects preview node ids', () => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="0" y="0" width="24" height="24" fill="none" />
  <path d="M2 2h8v8H2Z" />
  <use href="#px" x="2" y="2" width="1" height="1" />
</svg>`;
		const model = buildSvgInspectionModel(svg);

		expect(model.status).toBe('ready');
		expect(model.entries.map((entry) => entry.tag)).toEqual(['rect', 'path', 'use']);
		expect(model.instrumentedSvg).toContain('data-px-node-id="px-node-1"');
		expect(model.instrumentedSvg).toContain('data-px-node-id="px-node-2"');
		expect(model.instrumentedSvg).toContain('data-px-node-id="px-node-3"');
	});

	it('normalizes SVG deterministically', () => {
		const messy = '<svg xmlns="http://www.w3.org/2000/svg"><g><path d="M0 0h1v1H0Z"/></g></svg>';

		const normalizedOnce = normalizeSvgMarkup(messy);
		const normalizedTwice = normalizeSvgMarkup(normalizedOnce);

		expect(normalizedOnce).toContain('\n');
		expect(normalizedTwice).toBe(normalizedOnce);
	});

	it('returns invalid status for malformed SVG and partial for mismatched mapping', () => {
		const invalid = buildSvgInspectionModel('<svg><path d="M0 0"');
		expect(invalid.status).toBe('invalid');
		expect(invalid.errors.length).toBeGreaterThan(0);

		const partial = buildSvgInspectionModel(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- <path d="M0 0h24v24H0Z" /> -->
  <path d="M2 2h8v8H2Z" />
</svg>`
		);

		expect(partial.status).toBe('partial');
		expect(partial.errors.length).toBeGreaterThan(0);
	});

	it('finds entry by source offset', () => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 2h8v8H2Z" />
</svg>`;
		const model = buildSvgInspectionModel(svg);
		const entry = model.entries[0];

		expect(entry).toBeDefined();
		const resolved = findSvgMapEntryByOffset(model.entries, entry.sourceStart + 2);
		expect(resolved?.id).toBe(entry.id);
		expect(findSvgMapEntryByOffset(model.entries, 999_999)).toBeNull();
	});

	it('preserves symbol preserveAspectRatio attribute during instrumentation', () => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <symbol id="px" viewBox="0 0 1 1" overflow="visible" preserveAspectRatio="none">
      <rect width="1" height="1" />
    </symbol>
  </defs>
  <use href="#px" x="13" y="9" width="2" height="1" />
</svg>`;
		const model = buildSvgInspectionModel(svg);

		expect(model.status).toBe('ready');
		expect(model.instrumentedSvg).toContain('preserveAspectRatio="none"');
	});
});
