// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import { buildSvgVisualDiff } from './svg-visual-diff';

describe('svg-visual-diff', () => {
	it('detects added and removed rect cells', () => {
		const baseline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="1" y="1" width="1" height="1" />
  <rect x="2" y="1" width="1" height="1" />
</svg>`;
		const edited = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="1" y="1" width="1" height="1" />
  <rect x="3" y="1" width="1" height="1" />
</svg>`;

		const result = buildSvgVisualDiff(baseline, edited);

		expect(result.status).toBe('ready');
		expect(result.svg).toContain('fill="#4ade80"');
		expect(result.svg).toContain('fill="#fb7185"');
		expect(result.svg).toContain('x="3" y="1"');
		expect(result.svg).toContain('x="2" y="1"');
	});

	it('supports width and height edits on <use href="#px">', () => {
		const baseline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <symbol id="px" viewBox="0 0 1 1" overflow="visible" preserveAspectRatio="none">
      <rect width="1" height="1"/>
    </symbol>
  </defs>
  <use href="#px" x="10" y="8" width="1" height="1" />
</svg>`;
		const edited = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <symbol id="px" viewBox="0 0 1 1" overflow="visible" preserveAspectRatio="none">
      <rect width="1" height="1"/>
    </symbol>
  </defs>
  <use href="#px" x="10" y="8" width="2" height="1" />
</svg>`;

		const result = buildSvgVisualDiff(baseline, edited);

		expect(result.status).toBe('ready');
		expect(result.svg).toContain('x="11" y="8"');
		expect(result.message).toContain('Added 1');
	});

	it('returns invalid for malformed SVG', () => {
		const result = buildSvgVisualDiff('<svg><path d="M0 0"', '<svg></svg>');

		expect(result.status).toBe('invalid');
		expect(result.message.length).toBeGreaterThan(0);
		expect(result.svg).toBe('');
	});

	it('returns unsupported status for unsupported drawable tags without crashing', () => {
		const baseline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1h2"/></svg>`;
		const edited = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1" y="1" width="1" height="1"/></svg>`;

		const result = buildSvgVisualDiff(baseline, edited);

		expect(result.status).toBe('unsupported');
		expect(result.message).toContain('Unsupported drawable tags');
		expect(result.svg).toContain('<svg');
	});
});
