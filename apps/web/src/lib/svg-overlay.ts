export interface SvgOverlaySuccess {
	ok: true;
	markup: string;
}

export interface SvgOverlayFailure {
	ok: false;
	error: string;
}

export type SvgOverlayResult = SvgOverlaySuccess | SvgOverlayFailure;

const UNSAFE_ELEMENT_TAGS = new Set(['script', 'foreignobject']);
const UNSAFE_HREF_PATTERN = /^\s*javascript:/i;

function sanitizeElementAttributes(element: Element): void {
	const attributes = [...element.attributes];

	for (const attribute of attributes) {
		const attributeName = attribute.name.toLowerCase();
		const value = attribute.value;

		if (attributeName.startsWith('on')) {
			element.removeAttribute(attribute.name);
			continue;
		}

		if (
			(attributeName === 'href' || attributeName === 'xlink:href') &&
			UNSAFE_HREF_PATTERN.test(value)
		) {
			element.removeAttribute(attribute.name);
		}
	}
}

function sanitizeSvgDocument(document: Document): void {
	const root = document.documentElement;
	const nodes = [root, ...Array.from(root.querySelectorAll('*'))];

	for (const node of nodes) {
		const tagName = node.tagName.toLowerCase();

		if (UNSAFE_ELEMENT_TAGS.has(tagName)) {
			node.remove();
			continue;
		}

		sanitizeElementAttributes(node);
	}

	root.setAttribute('width', '100%');
	root.setAttribute('height', '100%');
}

export function prepareSvgOverlayMarkup(source: string): SvgOverlayResult {
	if (typeof source !== 'string' || source.trim().length === 0) {
		return {
			ok: false,
			error: 'Overlay SVG input is empty.'
		};
	}

	if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
		return {
			ok: false,
			error: 'Overlay SVG parsing is unavailable in this runtime.'
		};
	}

	const parser = new DOMParser();
	const parsed = parser.parseFromString(source, 'image/svg+xml');
	const parserError = parsed.querySelector('parsererror');

	if (parserError) {
		return {
			ok: false,
			error: 'Overlay SVG markup is invalid.'
		};
	}

	if (parsed.documentElement.nodeName.toLowerCase() !== 'svg') {
		return {
			ok: false,
			error: 'Overlay root element must be <svg>.'
		};
	}

	sanitizeSvgDocument(parsed);
	const serializer = new XMLSerializer();

	return {
		ok: true,
		markup: serializer.serializeToString(parsed)
	};
}
