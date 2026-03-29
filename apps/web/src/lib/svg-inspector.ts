export interface SvgMapEntry {
	id: string;
	tag: string;
	sourceStart: number;
	sourceEnd: number;
	lineStart: number;
	lineEnd: number;
}

export type SvgInspectionStatus = 'ready' | 'partial' | 'invalid';

export interface SvgInspectionModel {
	normalizedSvg: string;
	instrumentedSvg: string;
	entries: readonly SvgMapEntry[];
	errors: readonly string[];
	status: SvgInspectionStatus;
}

const INDENT = '  ';
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
const TAG_TOKEN_PATTERN = /<\/?([A-Za-z][A-Za-z0-9:._-]*)(?:\s[^<>]*?)?\/?\s*>/g;

interface DrawableRange {
	tag: string;
	sourceStart: number;
	sourceEnd: number;
	lineStart: number;
	lineEnd: number;
}

interface StackFrame {
	tag: string;
	entryIndex: number | null;
}

interface ParseResult {
	document: Document | null;
	error: string | null;
}

interface LineIndex {
	starts: readonly number[];
}

function createLineIndex(source: string): LineIndex {
	const starts: number[] = [0];

	for (let index = 0; index < source.length; index += 1) {
		if (source[index] === '\n') {
			starts.push(index + 1);
		}
	}

	return { starts };
}

function getLineFromOffset(lineIndex: LineIndex, offset: number): number {
	const starts = lineIndex.starts;
	let low = 0;
	let high = starts.length - 1;
	let result = 0;

	while (low <= high) {
		const middle = (low + high) >> 1;

		if (starts[middle] <= offset) {
			result = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}

	return result + 1;
}

function parseSvgDocument(source: string): ParseResult {
	if (typeof DOMParser === 'undefined') {
		return {
			document: null,
			error: 'DOMParser is unavailable in this runtime.'
		};
	}

	const parser = new DOMParser();
	const document = parser.parseFromString(source, 'image/svg+xml');
	const parserError = document.querySelector('parsererror');

	if (parserError) {
		return {
			document: null,
			error: 'SVG markup is invalid.'
		};
	}

	if (document.documentElement.nodeName.toLowerCase() !== 'svg') {
		return {
			document: null,
			error: 'Root element must be <svg>.'
		};
	}

	return {
		document,
		error: null
	};
}

function isSelfClosingTagToken(token: string): boolean {
	return /\/\s*>$/.test(token);
}

function collectDrawableRanges(source: string): readonly DrawableRange[] {
	const ranges: DrawableRange[] = [];
	const stack: StackFrame[] = [];
	const lineIndex = createLineIndex(source);
	let defsDepth = 0;

	for (const match of source.matchAll(TAG_TOKEN_PATTERN)) {
		const token = match[0] ?? '';
		const rawTag = match[1] ?? '';
		const tag = rawTag.toLowerCase();
		const sourceStart = match.index ?? 0;
		const sourceEnd = sourceStart + token.length;
		const isClosing = token.startsWith('</');
		const isSelfClosing = isSelfClosingTagToken(token);

		if (isClosing) {
			for (let index = stack.length - 1; index >= 0; index -= 1) {
				const frame = stack[index];

				if (frame.tag !== tag) {
					continue;
				}

				stack.splice(index, 1);

				if (frame.entryIndex !== null) {
					const range = ranges[frame.entryIndex];

					if (range) {
						range.sourceEnd = sourceEnd;
						range.lineEnd = getLineFromOffset(lineIndex, Math.max(sourceStart, sourceEnd - 1));
					}
				}

				break;
			}

			if (tag === 'defs' && defsDepth > 0) {
				defsDepth -= 1;
			}

			continue;
		}

		const isDrawable = DRAWABLE_TAGS.has(tag) && defsDepth === 0;

		if (isDrawable) {
			ranges.push({
				tag,
				sourceStart,
				sourceEnd,
				lineStart: getLineFromOffset(lineIndex, sourceStart),
				lineEnd: getLineFromOffset(lineIndex, Math.max(sourceStart, sourceEnd - 1))
			});
		}

		if (!isSelfClosing) {
			stack.push({
				tag,
				entryIndex: isDrawable ? ranges.length - 1 : null
			});
		}

		if (tag === 'defs' && !isSelfClosing) {
			defsDepth += 1;
		}
	}

	return ranges;
}

function formatSvgMarkup(source: string): string {
	const compact = source.replace(/>\s+</g, '><').trim();

	if (!compact) {
		return '';
	}

	const tokens = compact
		.split(/(?=<)/g)
		.map((token) => token.trim())
		.filter(Boolean);
	const lines: string[] = [];
	let depth = 0;

	for (const token of tokens) {
		const isClosing = token.startsWith('</');
		const isDeclaration = token.startsWith('<?') || token.startsWith('<!');
		const isSelfClosing = isSelfClosingTagToken(token);

		if (isClosing) {
			depth = Math.max(0, depth - 1);
		}

		lines.push(`${INDENT.repeat(depth)}${token}`);

		if (!isClosing && !isSelfClosing && !isDeclaration) {
			depth += 1;
		}
	}

	return lines.join('\n');
}

function collectDrawableElements(document: Document): readonly Element[] {
	const root = document.documentElement;
	const elements: Element[] = [];

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
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

function cloneAndInstrument(document: Document): {
	instrumentedSvg: string;
	ids: readonly string[];
	tags: readonly string[];
} {
	const cloned = document.cloneNode(true);

	if (!(cloned instanceof Document)) {
		return {
			instrumentedSvg: '',
			ids: [],
			tags: []
		};
	}

	const drawableElements = collectDrawableElements(cloned);
	const ids: string[] = [];
	const tags: string[] = [];

	drawableElements.forEach((element, index) => {
		const id = `px-node-${index + 1}`;
		element.setAttribute('data-px-node-id', id);
		ids.push(id);
		tags.push(element.tagName.toLowerCase());
	});

	const serializer = new XMLSerializer();
	const instrumentedSvg = serializer.serializeToString(cloned);

	return {
		instrumentedSvg,
		ids,
		tags
	};
}

function buildEntries(
	ranges: readonly DrawableRange[],
	ids: readonly string[]
): readonly SvgMapEntry[] {
	const count = Math.min(ranges.length, ids.length);
	const entries: SvgMapEntry[] = [];

	for (let index = 0; index < count; index += 1) {
		const range = ranges[index];
		const id = ids[index];

		if (!range || !id) {
			continue;
		}

		entries.push({
			id,
			tag: range.tag,
			sourceStart: range.sourceStart,
			sourceEnd: range.sourceEnd,
			lineStart: range.lineStart,
			lineEnd: range.lineEnd
		});
	}

	return entries;
}

function createInvalidModel(source: string, error: string): SvgInspectionModel {
	return {
		normalizedSvg: source,
		instrumentedSvg: source,
		entries: [],
		errors: [error],
		status: 'invalid'
	};
}

export function normalizeSvgMarkup(source: string): string {
	const parseResult = parseSvgDocument(source);

	if (!parseResult.document) {
		return source;
	}

	const serializer = new XMLSerializer();
	const serialized = serializer.serializeToString(parseResult.document);
	return formatSvgMarkup(serialized);
}

export function buildSvgInspectionModel(source: string): SvgInspectionModel {
	const parseResult = parseSvgDocument(source);

	if (!parseResult.document || parseResult.error) {
		return createInvalidModel(source, parseResult.error ?? 'SVG markup is invalid.');
	}

	const ranges = collectDrawableRanges(source);
	const { instrumentedSvg, ids, tags } = cloneAndInstrument(parseResult.document);
	const entries = buildEntries(ranges, ids);
	const errors: string[] = [];
	let status: SvgInspectionStatus = 'ready';

	if (ranges.length !== ids.length) {
		status = 'partial';
		errors.push(
			`Mapped ${entries.length} drawable elements; source ranges=${ranges.length}, instrumented nodes=${ids.length}.`
		);
	}

	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		const tag = tags[index];

		if (!entry || !tag || entry.tag !== tag) {
			status = 'partial';
			errors.push('Tag ordering mismatch between source and preview instrumentation.');
			break;
		}
	}

	return {
		normalizedSvg: source,
		instrumentedSvg,
		entries,
		errors,
		status
	};
}

export function findSvgMapEntryByOffset(
	entries: readonly SvgMapEntry[],
	offset: number | null | undefined
): SvgMapEntry | null {
	if (offset === null || offset === undefined || !Number.isFinite(offset)) {
		return null;
	}

	for (const entry of entries) {
		if (offset >= entry.sourceStart && offset <= entry.sourceEnd) {
			return entry;
		}
	}

	return null;
}
