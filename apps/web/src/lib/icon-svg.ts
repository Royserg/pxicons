import { lucidePixelMap, type PixelIcon, type PixelShape } from '@pxicons/lucide';

export interface MetaballOptions {
	enabled: boolean;
	strength: number;
}

export interface SvgCustomizationOptions {
	color: string;
	size: number;
	padding: number;
	pixelGap?: number;
	backgroundColor?: string;
	shape?: PixelShape;
	scope?: RenderScope;
	metaball?: MetaballOptions;
}

export type SvgOutputMode = 'raw' | 'optimized';

const PIXEL_CANVAS_SIZE = 24;
const DEFAULT_COLOR = 'currentColor';

type RenderScope = 'grid' | 'detail';
type PixelRectRun = readonly [number, number, number, number];

const gridRawSvgCache = new Map<string, string>();
const detailRawSvgCache = new Map<string, string>();
const gridOptimizedSvgCache = new Map<string, string>();
const detailOptimizedSvgCache = new Map<string, string>();
const rectRunCache = new Map<string, readonly PixelRectRun[]>();
const optimizedPathCache = new Map<string, string>();

function clampInteger(value: number, minimum: number): number {
	if (!Number.isFinite(value)) {
		return minimum;
	}

	return Math.max(minimum, Math.round(value));
}

function clampPadding(value: number): number {
	const maxPadding = Math.floor(PIXEL_CANVAS_SIZE / 2) - 1;
	return Math.min(clampInteger(value, 0), maxPadding);
}

function clampPixelGap(value: number | undefined): number {
	if (value === undefined || !Number.isFinite(value)) {
		return 0;
	}

	return Number(Math.min(0.95, Math.max(0, value)).toFixed(3));
}

function formatNumber(value: number): string {
	const rounded = Math.round(value * 1000) / 1000;

	if (Number.isInteger(rounded)) {
		return String(rounded);
	}

	return String(rounded)
		.replace(/\.0+$/, '')
		.replace(/(\.\d*?)0+$/, '$1');
}

function normalizeShape(shape: PixelShape | undefined): PixelShape {
	if (shape === 'circle' || shape === 'rounded') {
		return shape;
	}

	return 'square';
}

function normalizeScope(scope: RenderScope | undefined): RenderScope {
	if (scope === 'grid') {
		return 'grid';
	}

	return 'detail';
}

function normalizeOutputMode(mode: SvgOutputMode | undefined): SvgOutputMode {
	if (mode === 'optimized') {
		return 'optimized';
	}

	return 'raw';
}

function hashText(value: string): string {
	let hash = 2166136261;

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0).toString(36);
}

function toSymbolId(): string {
	// Symbol definitions are local to one SVG, so a short id is enough.
	return 'px';
}

function resolvePrimitiveGeometry(pixelGap: number): { pixelSize: number; pixelInset: number } {
	const pixelSize = Number(Math.min(2, Math.max(0.05, 1 - pixelGap)).toFixed(3));
	const pixelInset = Number(((1 - pixelSize) / 2).toFixed(3));

	return { pixelSize, pixelInset };
}

function getPrimitiveMarkup(shape: PixelShape, pixelSize: number, pixelInset: number): string {
	const isDefaultGeometry = pixelSize === 1 && pixelInset === 0;

	if (isDefaultGeometry) {
		switch (shape) {
			case 'circle':
				return '<circle cx="0.5" cy="0.5" r="0.5" />';
			case 'rounded':
				return '<rect width="1" height="1" rx="0.24" ry="0.24" />';
			case 'square':
			default:
				return '<rect width="1" height="1" />';
		}
	}

	const inset = formatNumber(pixelInset);
	const size = formatNumber(pixelSize);

	switch (shape) {
		case 'circle': {
			const center = formatNumber(pixelInset + pixelSize / 2);
			const radius = formatNumber(pixelSize / 2);
			return `<circle cx="${center}" cy="${center}" r="${radius}" />`;
		}
		case 'rounded': {
			const cornerRadius = formatNumber(Math.min(0.24, pixelSize / 2));
			return `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" />`;
		}
		case 'square':
		default:
			return `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" />`;
	}
}

function toFilterId(iconId: string, signature: string): string {
	const safeIconId = iconId
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
	const fallbackId = safeIconId || 'icon';
	return `px-${fallbackId}-mb-${hashText(signature)}`;
}

function createUsesMarkup(symbolId: string, iconId: string): string {
	const cells = lucidePixelMap[iconId] ?? [];

	if (!cells.length) {
		return '';
	}

	return cells
		.map(([x, y]) => `    <use href="#${symbolId}" x="${x}" y="${y}" width="1" height="1" />`)
		.join('\n');
}

function clampStrength(value: number | undefined): number {
	if (value === undefined || !Number.isFinite(value)) {
		return 45;
	}

	return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeMetaball(value: MetaballOptions | undefined): MetaballOptions {
	return {
		enabled: Boolean(value?.enabled),
		strength: clampStrength(value?.strength)
	};
}

function createMetaballFilterMarkup(filterId: string, strength: number): string {
	const normalizedStrength = strength / 100;
	const dilation = formatNumber(0.02 + 0.22 * normalizedStrength);
	const stdDeviation = formatNumber(0.12 + 0.76 * normalizedStrength);

	return `    <filter id="${filterId}" x="-3" y="-3" width="30" height="30" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">\n      <feMorphology in="SourceGraphic" operator="dilate" radius="${dilation}" result="metaball-grow" />\n      <feGaussianBlur in="metaball-grow" stdDeviation="${stdDeviation}" result="metaball-blur" />\n      <feColorMatrix in="metaball-blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -11" />\n    </filter>`;
}

function normalizeColor(value: string | undefined, fallback: string): string {
	const normalized = value?.trim();

	if (!normalized) {
		return fallback;
	}

	return normalized;
}

function createSquareSubpath(x: number, y: number, width: number, height: number): string {
	return `M${formatNumber(x)} ${formatNumber(y)}h${formatNumber(width)}v${formatNumber(height)}h-${formatNumber(width)}Z`;
}

function createCircleSubpath(x: number, y: number, size: number): string {
	const radius = size / 2;
	const cx = x + radius;
	const cy = y + radius;
	const diameter = radius * 2;
	const radiusText = formatNumber(radius);
	const diameterText = formatNumber(diameter);

	return `M${formatNumber(cx)} ${formatNumber(cy - radius)}a${radiusText} ${radiusText} 0 1 0 0 ${diameterText}a${radiusText} ${radiusText} 0 1 0 0 -${diameterText}Z`;
}

function createRoundedSubpath(x: number, y: number, size: number): string {
	const radius = Math.min(0.24, size / 2);

	if (radius <= 0) {
		return createSquareSubpath(x, y, size, size);
	}

	const right = x + size;
	const bottom = y + size;
	const radiusText = formatNumber(radius);

	return [
		`M${formatNumber(x + radius)} ${formatNumber(y)}`,
		`H${formatNumber(right - radius)}`,
		`A${radiusText} ${radiusText} 0 0 1 ${formatNumber(right)} ${formatNumber(y + radius)}`,
		`V${formatNumber(bottom - radius)}`,
		`A${radiusText} ${radiusText} 0 0 1 ${formatNumber(right - radius)} ${formatNumber(bottom)}`,
		`H${formatNumber(x + radius)}`,
		`A${radiusText} ${radiusText} 0 0 1 ${formatNumber(x)} ${formatNumber(bottom - radius)}`,
		`V${formatNumber(y + radius)}`,
		`A${radiusText} ${radiusText} 0 0 1 ${formatNumber(x + radius)} ${formatNumber(y)}Z`
	].join('');
}

function getRectRuns(iconId: string): readonly PixelRectRun[] {
	const cached = rectRunCache.get(iconId);

	if (cached) {
		return cached;
	}

	const cells = lucidePixelMap[iconId] ?? [];
	const rows = new Map<number, number[]>();

	for (const [x, y] of cells) {
		const row = rows.get(y);

		if (row) {
			row.push(x);
		} else {
			rows.set(y, [x]);
		}
	}

	const runs: PixelRectRun[] = [];
	const ys = [...rows.keys()].sort((a, b) => a - b);

	for (const y of ys) {
		const xs = [...new Set(rows.get(y) ?? [])].sort((a, b) => a - b);

		if (xs.length === 0) {
			continue;
		}

		let startX = xs[0];
		let previousX = xs[0];

		for (let index = 1; index < xs.length; index += 1) {
			const currentX = xs[index];

			if (currentX === previousX + 1) {
				previousX = currentX;
				continue;
			}

			runs.push([startX, y, previousX - startX + 1, 1]);
			startX = currentX;
			previousX = currentX;
		}

		runs.push([startX, y, previousX - startX + 1, 1]);
	}

	rectRunCache.set(iconId, runs);
	return runs;
}

function createOptimizedPathData(
	iconId: string,
	shape: PixelShape,
	pixelSize: number,
	pixelInset: number
): string | null {
	if (!Number.isFinite(pixelSize) || !Number.isFinite(pixelInset) || pixelSize <= 0) {
		return null;
	}

	const cells = lucidePixelMap[iconId] ?? [];

	if (!cells.length) {
		return '';
	}

	const key = `${iconId}|${shape}|${formatNumber(pixelSize)}|${formatNumber(pixelInset)}`;
	const cached = optimizedPathCache.get(key);

	if (cached !== undefined) {
		return cached;
	}

	let pathData = '';

	if (shape === 'square' && pixelSize >= 1) {
		const rectRuns = getRectRuns(iconId);
		pathData = rectRuns
			.map(([x, y, width, height]) => {
				const runX = x + pixelInset;
				const runY = y + pixelInset;
				const runWidth = width - 1 + pixelSize;
				const runHeight = height - 1 + pixelSize;
				return createSquareSubpath(runX, runY, runWidth, runHeight);
			})
			.join('');
	} else {
		pathData = cells
			.map(([x, y]) => {
				const px = x + pixelInset;
				const py = y + pixelInset;

				if (shape === 'circle') {
					return createCircleSubpath(px, py, pixelSize);
				}

				if (shape === 'rounded') {
					return createRoundedSubpath(px, py, pixelSize);
				}

				return createSquareSubpath(px, py, pixelSize, pixelSize);
			})
			.join('');
	}

	optimizedPathCache.set(key, pathData);
	return pathData;
}

interface NormalizedSvgBuildContext {
	color: string;
	size: number;
	padding: number;
	pixelGap: number;
	backgroundColor: string;
	shape: PixelShape;
	scope: RenderScope;
	metaball: MetaballOptions;
	cacheKey: string;
	cache: Map<string, string>;
}

function normalizeSvgBuildContext(
	icon: PixelIcon,
	options: SvgCustomizationOptions,
	mode: SvgOutputMode
): NormalizedSvgBuildContext {
	const color = normalizeColor(options.color, DEFAULT_COLOR);
	const size = clampInteger(options.size, PIXEL_CANVAS_SIZE);
	const padding = clampPadding(options.padding);
	const pixelGap = clampPixelGap(options.pixelGap);
	const backgroundColor = normalizeColor(options.backgroundColor, '');
	const shape = normalizeShape(options.shape);
	const scope = normalizeScope(options.scope);
	const metaball = normalizeMetaball(options.metaball);
	const cacheKey = `${mode}|${icon.id}|${shape}|${color}|${size}|${padding}|${backgroundColor}|pg:${pixelGap}|mb:${metaball.enabled ? 1 : 0}:${metaball.strength}`;
	const cache =
		scope === 'grid'
			? mode === 'optimized'
				? gridOptimizedSvgCache
				: gridRawSvgCache
			: mode === 'optimized'
				? detailOptimizedSvgCache
				: detailRawSvgCache;

	return {
		color,
		size,
		padding,
		pixelGap,
		backgroundColor,
		shape,
		scope,
		metaball,
		cacheKey,
		cache
	};
}

function buildRawCustomizedSvg(icon: PixelIcon, options: SvgCustomizationOptions): string {
	const context = normalizeSvgBuildContext(icon, options, 'raw');
	const cachedSvg = context.cache.get(context.cacheKey);

	if (cachedSvg) {
		return cachedSvg;
	}

	const drawableSize = Math.max(1, PIXEL_CANVAS_SIZE - context.padding * 2);
	const scale = drawableSize / PIXEL_CANVAS_SIZE;
	const translate = context.padding;
	const symbolId = toSymbolId();
	const filterId = toFilterId(icon.id, context.cacheKey);
	const primitiveGeometry = resolvePrimitiveGeometry(context.pixelGap);
	const primitive = getPrimitiveMarkup(
		context.shape,
		primitiveGeometry.pixelSize,
		primitiveGeometry.pixelInset
	);
	const usesMarkup = createUsesMarkup(symbolId, icon.id);
	const metaballFilter = context.metaball.enabled
		? `${createMetaballFilterMarkup(filterId, context.metaball.strength)}\n`
		: '';
	const groupFilterAttribute = context.metaball.enabled ? ` filter="url(#${filterId})"` : '';
	const shapeRendering = context.metaball.enabled ? 'geometricPrecision' : 'crispEdges';
	const backgroundRect = context.backgroundColor
		? `  <rect x="0" y="0" width="${PIXEL_CANVAS_SIZE}" height="${PIXEL_CANVAS_SIZE}" fill="${context.backgroundColor}"/>\n`
		: '';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIXEL_CANVAS_SIZE} ${PIXEL_CANVAS_SIZE}" width="${context.size}" height="${context.size}" fill="none" shape-rendering="${shapeRendering}">\n${backgroundRect}  <defs>\n    <symbol id="${symbolId}" viewBox="0 0 1 1" overflow="visible">\n      ${primitive}\n    </symbol>\n${metaballFilter}  </defs>\n  <g fill="${context.color}" transform="translate(${formatNumber(translate)} ${formatNumber(translate)}) scale(${formatNumber(scale)})"${groupFilterAttribute}>\n${usesMarkup}\n  </g>\n</svg>`;

	context.cache.set(context.cacheKey, svg);
	return svg;
}

export function buildCustomizedSvg(icon: PixelIcon, options: SvgCustomizationOptions): string {
	return buildRawCustomizedSvg(icon, options);
}

export function buildOptimizedSvg(icon: PixelIcon, options: SvgCustomizationOptions): string {
	const context = normalizeSvgBuildContext(icon, options, 'optimized');
	const cachedSvg = context.cache.get(context.cacheKey);

	if (cachedSvg) {
		return cachedSvg;
	}

	const drawableSize = Math.max(1, PIXEL_CANVAS_SIZE - context.padding * 2);
	const scale = drawableSize / PIXEL_CANVAS_SIZE;
	const translate = context.padding;
	const filterId = toFilterId(icon.id, context.cacheKey);
	const primitiveGeometry = resolvePrimitiveGeometry(context.pixelGap);
	const pathData = createOptimizedPathData(
		icon.id,
		context.shape,
		primitiveGeometry.pixelSize,
		primitiveGeometry.pixelInset
	);

	if (pathData === null) {
		return buildRawCustomizedSvg(icon, options);
	}

	const metaballFilter = context.metaball.enabled
		? `${createMetaballFilterMarkup(filterId, context.metaball.strength)}\n`
		: '';
	const defsBlock = metaballFilter ? `  <defs>\n${metaballFilter}  </defs>\n` : '';
	const groupFilterAttribute = context.metaball.enabled ? ` filter="url(#${filterId})"` : '';
	const shapeRendering = context.metaball.enabled ? 'geometricPrecision' : 'crispEdges';
	const backgroundRect = context.backgroundColor
		? `  <rect x="0" y="0" width="${PIXEL_CANVAS_SIZE}" height="${PIXEL_CANVAS_SIZE}" fill="${context.backgroundColor}"/>\n`
		: '';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIXEL_CANVAS_SIZE} ${PIXEL_CANVAS_SIZE}" width="${context.size}" height="${context.size}" fill="none" shape-rendering="${shapeRendering}">\n${backgroundRect}${defsBlock}  <g fill="${context.color}" transform="translate(${formatNumber(translate)} ${formatNumber(translate)}) scale(${formatNumber(scale)})"${groupFilterAttribute}>\n    <path d="${pathData}" />\n  </g>\n</svg>`;

	context.cache.set(context.cacheKey, svg);
	return svg;
}

export function buildExportSvg(
	icon: PixelIcon,
	options: SvgCustomizationOptions,
	mode: SvgOutputMode | undefined
): string {
	const normalizedMode = normalizeOutputMode(mode);

	if (normalizedMode === 'optimized') {
		return buildOptimizedSvg(icon, options);
	}

	return buildRawCustomizedSvg(icon, options);
}
