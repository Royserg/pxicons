import { describe, expect, it } from 'vite-plus/test';
import { getLucideIcon, lucidePixelMap } from '@pxicons/lucide';
import { buildCustomizedSvg, buildExportSvg, buildOptimizedSvg } from './icon-svg';

const settingsIcon = getLucideIcon('settings');
const searchIcon = getLucideIcon('search');

if (!settingsIcon) {
	throw new Error('Expected settings icon fixture to exist');
}

if (!searchIcon) {
	throw new Error('Expected search icon fixture to exist');
}

function extractSymbolId(svg: string): string {
	const match = svg.match(/<symbol id="([^"]+)"/);

	if (!match?.[1]) {
		throw new Error('Expected SVG to include a symbol id');
	}

	return match[1];
}

function extractMetaballFilterId(svg: string): string {
	const match = svg.match(/<filter id="([^"]*mb[^"]*)"/);

	if (!match?.[1]) {
		throw new Error('Expected SVG to include a metaball filter id');
	}

	return match[1];
}

describe('buildCustomizedSvg', () => {
	it('renders into a fixed 24x24 canvas using symbol/use structure', () => {
		const customized = buildCustomizedSvg(settingsIcon, {
			color: '#ff00aa',
			size: 128,
			padding: 3,
			backgroundColor: '#f4f4f4',
			shape: 'square'
		});

		expect(customized).toContain('width="128"');
		expect(customized).toContain('height="128"');
		expect(customized).toContain('viewBox="0 0 24 24"');
		expect(customized).toContain('fill="#ff00aa"');
		expect(customized).toContain('fill="#f4f4f4"');
		expect(customized).toContain('<defs>');
		expect(customized).toContain('<symbol id="');
		expect(customized).toContain('<use href="#');
		expect(customized).toContain('width="1" height="1"');
		expect(customized.match(/<use href=/g)?.length ?? 0).toBe(lucidePixelMap.settings.length);
		expect(customized).toContain('transform="translate(3 3) scale(0.75)"');
	});

	it('omits identity transform on the group when padding keeps 1:1 scale', () => {
		const customized = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square'
		});

		expect(customized).not.toContain('transform="translate(0 0) scale(1)"');
		expect(customized).not.toMatch(/<g[^>]* transform="/);
	});

	it('renders primitive geometry for circle and rounded shapes', () => {
		const circleSvg = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'circle'
		});
		const roundedSvg = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'rounded'
		});

		expect(circleSvg).toContain('<circle cx="0.5" cy="0.5" r="0.5" />');
		expect(roundedSvg).toContain('<rect width="1" height="1" rx="0.24" ry="0.24" />');
	});

	it('renders inset primitive geometry when pixelGap is enabled', () => {
		const gappedSquare = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square',
			pixelGap: 0.2
		});

		expect(gappedSquare).toContain('<rect x="0.1" y="0.1" width="0.8" height="0.8" />');
	});

	it('injects metaball filter only when enabled', () => {
		const metaballOn = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square',
			metaball: {
				enabled: true,
				strength: 45
			}
		});
		const metaballOff = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square',
			metaball: {
				enabled: false,
				strength: 45
			}
		});

		expect(metaballOn).toContain('<filter id="');
		expect(metaballOn).toContain('<feMorphology');
		expect(metaballOn).toContain('<feGaussianBlur');
		expect(metaballOn).toContain('<feColorMatrix');
		expect(metaballOn).toContain('stdDeviation="0.462"');
		expect(metaballOn).toContain('filter="url(#');
		expect(metaballOn).toContain('shape-rendering="geometricPrecision"');

		expect(metaballOff).not.toContain('<feGaussianBlur');
		expect(metaballOff).not.toContain('<feColorMatrix');
		expect(metaballOff).not.toContain('filter="url(#');
		expect(metaballOff).toContain('shape-rendering="crispEdges"');
	});

	it('uses a short local symbol id', () => {
		const settingsSquare = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'square'
		});
		const settingsSquareAgain = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'square'
		});
		const settingsCircle = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'circle'
		});
		const searchSquare = buildCustomizedSvg(searchIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'square'
		});
		const gapped = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'square',
			pixelGap: 0.2
		});

		expect(extractSymbolId(settingsSquare)).toBe('px');
		expect(extractSymbolId(settingsSquareAgain)).toBe('px');
		expect(extractSymbolId(settingsCircle)).toBe('px');
		expect(extractSymbolId(searchSquare)).toBe('px');
		expect(extractSymbolId(gapped)).toBe('px');
	});

	it('emits symbol with preserveAspectRatio none for per-use scaling edits', () => {
		const customized = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square'
		});

		expect(customized).toContain(
			'<symbol id="px" viewBox="0 0 1 1" overflow="visible" preserveAspectRatio="none">'
		);
	});

	it('keeps output unchanged when pixelGap is explicitly zero', () => {
		const implicitGap = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'rounded'
		});
		const explicitZeroGap = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'rounded',
			pixelGap: 0
		});

		expect(explicitZeroGap).toBe(implicitGap);
	});

	it('creates deterministic filter ids and varies by metaball strength', () => {
		const strength45 = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'rounded',
			metaball: {
				enabled: true,
				strength: 45
			}
		});
		const strength45Again = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'rounded',
			metaball: {
				enabled: true,
				strength: 45
			}
		});
		const strength75 = buildCustomizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 1,
			shape: 'rounded',
			metaball: {
				enabled: true,
				strength: 75
			}
		});

		expect(extractMetaballFilterId(strength45)).toBe(extractMetaballFilterId(strength45Again));
		expect(extractMetaballFilterId(strength45)).not.toBe(extractMetaballFilterId(strength75));
	});

	it('does not mutate the original source SVG', () => {
		const original = settingsIcon.svg;

		buildCustomizedSvg(settingsIcon, {
			color: '#111111',
			size: 256,
			padding: 4,
			backgroundColor: '',
			shape: 'rounded'
		});

		expect(settingsIcon.svg).toBe(original);
	});
});

describe('buildOptimizedSvg', () => {
	it('renders path-based output without symbol/use primitives', () => {
		const optimized = buildOptimizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 128,
			padding: 2,
			shape: 'square'
		});

		expect(optimized).toContain('<path d="');
		expect(optimized).not.toContain('<symbol id="');
		expect(optimized).not.toContain('<use href="#');
		expect(optimized).toContain('transform="translate(2 2) scale(0.833)"');
	});

	it('omits identity transform on optimized group when padding keeps 1:1 scale', () => {
		const optimized = buildOptimizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square'
		});

		expect(optimized).not.toContain('transform="translate(0 0) scale(1)"');
		expect(optimized).not.toMatch(/<g[^>]* transform="/);
	});

	it('varies optimized output by shape and pixelGap', () => {
		const square = buildOptimizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square'
		});
		const circle = buildOptimizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'circle'
		});
		const gapped = buildOptimizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'square',
			pixelGap: 0.2
		});

		expect(square).not.toBe(circle);
		expect(square).not.toBe(gapped);
	});

	it('includes metaball filter markup when enabled', () => {
		const metaballOn = buildOptimizedSvg(settingsIcon, {
			color: '#ffffff',
			size: 96,
			padding: 0,
			shape: 'rounded',
			metaball: {
				enabled: true,
				strength: 45
			}
		});

		expect(metaballOn).toContain('<filter id="');
		expect(metaballOn).toContain('<path d="');
		expect(metaballOn).toContain('filter="url(#');
	});
});

describe('buildExportSvg', () => {
	it('defaults to raw output when mode is undefined', () => {
		const implicit = buildExportSvg(
			settingsIcon,
			{
				color: '#ffffff',
				size: 96,
				padding: 0,
				shape: 'square'
			},
			undefined
		);
		const explicitRaw = buildExportSvg(
			settingsIcon,
			{
				color: '#ffffff',
				size: 96,
				padding: 0,
				shape: 'square'
			},
			'raw'
		);

		expect(implicit).toBe(explicitRaw);
		expect(implicit).toContain('<symbol id="');
	});

	it('switches to optimized output when mode is optimized', () => {
		const optimized = buildExportSvg(
			settingsIcon,
			{
				color: '#ffffff',
				size: 96,
				padding: 0,
				shape: 'square'
			},
			'optimized'
		);

		expect(optimized).toContain('<path d="');
		expect(optimized).not.toContain('<symbol id="');
	});
});
