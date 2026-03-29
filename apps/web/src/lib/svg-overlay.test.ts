// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import { prepareSvgOverlayMarkup } from './svg-overlay';

describe('svg-overlay', () => {
	it('accepts valid SVG and normalizes root size for preview fit', () => {
		const result = prepareSvgOverlayMarkup(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1" y="1" width="1" height="1"/></svg>`
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.markup).toContain('viewBox="0 0 24 24"');
		expect(result.markup).toContain('width="100%"');
		expect(result.markup).toContain('height="100%"');
	});

	it('rejects malformed SVG input', () => {
		const result = prepareSvgOverlayMarkup('<svg><path d="M0 0"');

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}

		expect(result.error).toContain('invalid');
	});

	it('rejects non-svg root elements', () => {
		const result = prepareSvgOverlayMarkup('<div>not svg</div>');

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}

		expect(result.error).toContain('<svg>');
	});

	it('preserves source viewBox fit behavior', () => {
		const result = prepareSvgOverlayMarkup(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="32" height="16"/></svg>`
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.markup).toContain('viewBox="0 0 32 16"');
		expect(result.markup).toContain('preserveAspectRatio="xMidYMid meet"');
	});

	it('strips unsafe tags and attributes for render-safe overlays', () => {
		const result = prepareSvgOverlayMarkup(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <script>alert(1)</script>
  <g onclick="alert(1)">
    <a href="javascript:alert(2)">
      <rect x="2" y="2" width="1" height="1"/>
    </a>
  </g>
</svg>`
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.markup).not.toContain('<script');
		expect(result.markup).not.toContain('onclick=');
		expect(result.markup).not.toContain('javascript:');
		expect(result.markup).toContain('<rect');
	});
});
