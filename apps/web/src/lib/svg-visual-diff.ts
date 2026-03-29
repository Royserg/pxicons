export type SvgVisualDiffStatus = 'ready' | 'invalid' | 'unsupported';

export interface SvgVisualDiffResult {
	status: SvgVisualDiffStatus;
	svg: string;
	message: string;
}

interface ParsedGridResult {
	status: SvgVisualDiffStatus;
	grid: boolean[][];
	message: string;
	unsupportedTags: readonly string[];
}

const GRID_SIZE = 24;
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const DRAWABLE_TAGS = new Set([
	'use',
	'rect',
	'circle',
	'ellipse',
	'line',
	'polyline',
	'polygon',
	'path'
]);
const ADDED_COLOR = '#4ade80';
const REMOVED_COLOR = '#fb7185';
const UNCHANGED_COLOR = '#f3f5f8';

function createGrid(): boolean[][] {
	return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => false));
}

function parseNumber(value: string | null, fallback: number): number {
	if (value === null) {
		return fallback;
	}

	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function stampRect(grid: boolean[][], x: number, y: number, width: number, height: number): void {
	if (width <= 0 || height <= 0) {
		return;
	}

	const minX = Math.max(0, Math.floor(x));
	const minY = Math.max(0, Math.floor(y));
	const maxX = Math.min(GRID_SIZE, Math.ceil(x + width));
	const maxY = Math.min(GRID_SIZE, Math.ceil(y + height));

	for (let gy = minY; gy < maxY; gy += 1) {
		for (let gx = minX; gx < maxX; gx += 1) {
			grid[gy][gx] = true;
		}
	}
}

function collectDrawableElements(document: Document): readonly Element[] {
	const elements: Element[] = [];
	const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT);
	let node: Node | null = walker.currentNode;

	while (node) {
		if (node instanceof Element) {
			const tag = node.tagName.toLowerCase();
			const inDefs = node.closest('defs') !== null;

			if (DRAWABLE_TAGS.has(tag) && !inDefs) {
				elements.push(node);
			}
		}

		node = walker.nextNode();
	}

	return elements;
}

function parseSvgGrid(source: string): ParsedGridResult {
	if (typeof DOMParser === 'undefined') {
		return {
			status: 'invalid',
			grid: createGrid(),
			message: 'DOMParser is unavailable in this runtime.',
			unsupportedTags: []
		};
	}

	const parser = new DOMParser();
	const document = parser.parseFromString(source, 'image/svg+xml');
	const parserError = document.querySelector('parsererror');

	if (parserError) {
		return {
			status: 'invalid',
			grid: createGrid(),
			message: 'SVG markup is invalid.',
			unsupportedTags: []
		};
	}

	if (document.documentElement.tagName.toLowerCase() !== 'svg') {
		return {
			status: 'invalid',
			grid: createGrid(),
			message: 'Root element must be <svg>.',
			unsupportedTags: []
		};
	}

	const grid = createGrid();
	const unsupportedTags = new Set<string>();
	const drawables = collectDrawableElements(document);

	for (const element of drawables) {
		const tag = element.tagName.toLowerCase();

		if (tag === 'rect') {
			stampRect(
				grid,
				parseNumber(element.getAttribute('x'), 0),
				parseNumber(element.getAttribute('y'), 0),
				parseNumber(element.getAttribute('width'), 0),
				parseNumber(element.getAttribute('height'), 0)
			);
			continue;
		}

		if (tag === 'use') {
			const href =
				element.getAttribute('href') ??
				element.getAttributeNS(XLINK_NS, 'href') ??
				'';

			if (href && href !== '#px') {
				unsupportedTags.add('use');
				continue;
			}

			stampRect(
				grid,
				parseNumber(element.getAttribute('x'), 0),
				parseNumber(element.getAttribute('y'), 0),
				parseNumber(element.getAttribute('width'), 1),
				parseNumber(element.getAttribute('height'), 1)
			);
			continue;
		}

		unsupportedTags.add(tag);
	}

	if (unsupportedTags.size > 0) {
		const tags = [...unsupportedTags].sort();
		return {
			status: 'unsupported',
			grid,
			message: `Unsupported drawable tags: ${tags.join(', ')}.`,
			unsupportedTags: tags
		};
	}

	return {
		status: 'ready',
		grid,
		message: '',
		unsupportedTags: []
	};
}

function serializeCells(cells: readonly [number, number][]): string {
	if (!cells.length) {
		return '';
	}

	return cells
		.map(([x, y]) => `    <rect x="${x}" y="${y}" width="1" height="1" />`)
		.join('\n');
}

function toDiffCells(baselineGrid: boolean[][], currentGrid: boolean[][]): {
	added: [number, number][];
	removed: [number, number][];
	unchanged: [number, number][];
} {
	const added: [number, number][] = [];
	const removed: [number, number][] = [];
	const unchanged: [number, number][] = [];

	for (let y = 0; y < GRID_SIZE; y += 1) {
		for (let x = 0; x < GRID_SIZE; x += 1) {
			const before = baselineGrid[y]?.[x] === true;
			const after = currentGrid[y]?.[x] === true;

			if (before && after) {
				unchanged.push([x, y]);
				continue;
			}

			if (!before && after) {
				added.push([x, y]);
				continue;
			}

			if (before && !after) {
				removed.push([x, y]);
			}
		}
	}

	return {
		added,
		removed,
		unchanged
	};
}

function createDiffSvgMarkup(
	cells: ReturnType<typeof toDiffCells>
): string {
	const unchangedMarkup = serializeCells(cells.unchanged);
	const addedMarkup = serializeCells(cells.added);
	const removedMarkup = serializeCells(cells.removed);

	return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${GRID_SIZE} ${GRID_SIZE}" width="384" height="384" fill="none" shape-rendering="crispEdges">\n  <rect x="0" y="0" width="${GRID_SIZE}" height="${GRID_SIZE}" fill="none"/>\n${unchangedMarkup ? `  <g fill="${UNCHANGED_COLOR}" opacity="0.16">\n${unchangedMarkup}\n  </g>\n` : ''}${addedMarkup ? `  <g fill="${ADDED_COLOR}" opacity="0.95">\n${addedMarkup}\n  </g>\n` : ''}${removedMarkup ? `  <g fill="${REMOVED_COLOR}" opacity="0.95">\n${removedMarkup}\n  </g>\n` : ''}</svg>`;
}

export function buildSvgVisualDiff(baselineSource: string, currentSource: string): SvgVisualDiffResult {
	const baseline = parseSvgGrid(baselineSource);
	const current = parseSvgGrid(currentSource);

	if (baseline.status === 'invalid') {
		return {
			status: 'invalid',
			svg: '',
			message: baseline.message
		};
	}

	if (current.status === 'invalid') {
		return {
			status: 'invalid',
			svg: '',
			message: current.message
		};
	}

	const diffCells = toDiffCells(baseline.grid, current.grid);
	const svg = createDiffSvgMarkup(diffCells);
	const hasChanges = diffCells.added.length > 0 || diffCells.removed.length > 0;

	if (baseline.status === 'unsupported' || current.status === 'unsupported') {
		const messageParts = [baseline.message, current.message]
			.filter(Boolean)
			.filter((message, index, values) => values.indexOf(message) === index);

		return {
			status: 'unsupported',
			svg,
			message: messageParts.join(' ')
		};
	}

	return {
		status: 'ready',
		svg,
		message: hasChanges
			? `Added ${diffCells.added.length}, removed ${diffCells.removed.length}.`
			: 'No visual changes.'
	};
}
