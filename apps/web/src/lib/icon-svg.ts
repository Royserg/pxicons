import { lucidePixelMap, type PixelIcon, type PixelShape } from '@pxicons/lucide';

export interface MetaballOptions {
	enabled: boolean;
	strength: number;
}

export interface SvgCustomizationOptions {
	color: string;
	size: number;
	padding: number;
	backgroundColor?: string;
	shape?: PixelShape;
	scope?: RenderScope;
	metaball?: MetaballOptions;
}

const PIXEL_CANVAS_SIZE = 24;
const DEFAULT_COLOR = '#111111';

type RenderScope = 'grid' | 'detail';

const gridSvgCache = new Map<string, string>();
const detailSvgCache = new Map<string, string>();

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

function hashText(value: string): string {
	let hash = 2166136261;

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0).toString(36);
}

function toSymbolId(iconId: string, shape: PixelShape, signature: string): string {
	const safeIconId = iconId
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
	const fallbackId = safeIconId || 'icon';
	return `px-${fallbackId}-${shape}-${hashText(signature)}`;
}

function getPrimitiveMarkup(shape: PixelShape): string {
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
		.map(
			([x, y]) =>
				`    <use href="#${symbolId}" x="${x}" y="${y}" width="1" height="1" />`
		)
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

export function buildCustomizedSvg(icon: PixelIcon, options: SvgCustomizationOptions): string {
	const color = normalizeColor(options.color, DEFAULT_COLOR);
	const size = clampInteger(options.size, PIXEL_CANVAS_SIZE);
	const padding = clampPadding(options.padding);
	const backgroundColor = normalizeColor(options.backgroundColor, '');
	const shape = normalizeShape(options.shape);
	const scope = normalizeScope(options.scope);
	const metaball = normalizeMetaball(options.metaball);
	const cacheKey = `${icon.id}|${shape}|${color}|${size}|${padding}|${backgroundColor}|mb:${metaball.enabled ? 1 : 0}:${metaball.strength}`;
	const cache = scope === 'grid' ? gridSvgCache : detailSvgCache;

	const cachedSvg = cache.get(cacheKey);

	if (cachedSvg) {
		return cachedSvg;
	}

	const drawableSize = Math.max(1, PIXEL_CANVAS_SIZE - padding * 2);
	const scale = drawableSize / PIXEL_CANVAS_SIZE;
	const translate = padding;
	const symbolId = toSymbolId(icon.id, shape, cacheKey);
	const filterId = toFilterId(icon.id, cacheKey);
	const primitive = getPrimitiveMarkup(shape);
	const usesMarkup = createUsesMarkup(symbolId, icon.id);
	const metaballFilter = metaball.enabled
		? `${createMetaballFilterMarkup(filterId, metaball.strength)}\n`
		: '';
	const groupFilterAttribute = metaball.enabled ? ` filter="url(#${filterId})"` : '';
	const shapeRendering = metaball.enabled ? 'geometricPrecision' : 'crispEdges';
	const backgroundRect = backgroundColor
		? `  <rect x="0" y="0" width="${PIXEL_CANVAS_SIZE}" height="${PIXEL_CANVAS_SIZE}" fill="${backgroundColor}"/>\n`
		: '';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIXEL_CANVAS_SIZE} ${PIXEL_CANVAS_SIZE}" width="${size}" height="${size}" fill="none" shape-rendering="${shapeRendering}">\n${backgroundRect}  <defs>\n    <symbol id="${symbolId}" viewBox="0 0 1 1" overflow="visible">\n      ${primitive}\n    </symbol>\n${metaballFilter}  </defs>\n  <g fill="${color}" transform="translate(${formatNumber(translate)} ${formatNumber(translate)}) scale(${formatNumber(scale)})"${groupFilterAttribute}>\n${usesMarkup}\n  </g>\n</svg>`;

	cache.set(cacheKey, svg);
	return svg;
}
