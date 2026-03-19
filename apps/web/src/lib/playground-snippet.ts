export type PlaygroundShape = 'square' | 'circle' | 'rounded';
export type PlaygroundRenderMode = 'auto' | 'raw' | 'optimized';

export interface PlaygroundSnippetProps {
	size: number;
	color: string;
	strokeWidth: number;
	absoluteStrokeWidth: boolean;
	pixelGap: number;
	shape: PlaygroundShape;
	renderMode: PlaygroundRenderMode;
	title: string;
}

const PROP_ORDER = [
	'size',
	'color',
	'strokeWidth',
	'absoluteStrokeWidth',
	'pixelGap',
	'shape',
	'renderMode',
	'title'
] as const;

function quoteString(value: string): string {
	return JSON.stringify(value);
}

function formatNumber(value: number): string {
	if (!Number.isFinite(value)) {
		return '0';
	}

	const normalized = Number.parseFloat(value.toFixed(4));
	return Number.isInteger(normalized) ? String(normalized) : String(normalized);
}

function serializeProp(
	key: keyof PlaygroundSnippetProps,
	value: PlaygroundSnippetProps[keyof PlaygroundSnippetProps]
): string {
	if (key === 'size' || key === 'strokeWidth' || key === 'pixelGap') {
		return `{${formatNumber(Number(value))}}`;
	}

	if (key === 'absoluteStrokeWidth') {
		return `{${value ? 'true' : 'false'}}`;
	}

	return quoteString(String(value));
}

export function buildPlaygroundSnippet(
	componentName: string,
	props: PlaygroundSnippetProps
): string {
	const normalizedComponentName = componentName.trim();

	if (!normalizedComponentName) {
		throw new Error('Component name is required.');
	}

	const propLines: string[] = [];

	for (const key of PROP_ORDER) {
		if (key === 'title' && props.title.trim().length === 0) {
			continue;
		}

		propLines.push(`  ${key}=${serializeProp(key, props[key])}`);
	}

	return `<script>
  import { ${normalizedComponentName} } from '@pxicons/lucide-svelte';
</script>

<${normalizedComponentName}
${propLines.join('\n')}
/>`;
}
