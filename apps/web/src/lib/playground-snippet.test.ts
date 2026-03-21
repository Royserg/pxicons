import { describe, expect, it } from 'vite-plus/test';
import { buildPlaygroundSnippet, type PlaygroundSnippetProps } from './playground-snippet';

const DEFAULT_PROPS: PlaygroundSnippetProps = {
	size: 24,
	color: 'currentColor',
	strokeWidth: 2,
	absoluteStrokeWidth: false,
	shape: 'square',
	renderMode: 'auto',
	title: ''
};

describe('buildPlaygroundSnippet', () => {
	it('builds import and component usage markup', () => {
		const snippet = buildPlaygroundSnippet('Settings', DEFAULT_PROPS);

		expect(snippet).toContain("import { Settings } from '@pxicons/lucide-svelte';");
		expect(snippet).toContain('<Settings');
		expect(snippet.trim().endsWith('/>')).toBe(true);
	});

	it('keeps prop serialization order stable', () => {
		const snippet = buildPlaygroundSnippet('Settings', {
			...DEFAULT_PROPS,
			title: 'Playground title'
		});

		const orderedTokens = [
			'size={24}',
			'color="currentColor"',
			'strokeWidth={2}',
			'absoluteStrokeWidth={false}',
			'shape="square"',
			'renderMode="auto"',
			'title="Playground title"'
		];

		let previousPosition = -1;
		for (const token of orderedTokens) {
			const tokenPosition = snippet.indexOf(token);
			expect(tokenPosition).toBeGreaterThan(previousPosition);
			previousPosition = tokenPosition;
		}
	});

	it('omits title prop when title is empty', () => {
		const snippet = buildPlaygroundSnippet('Settings', DEFAULT_PROPS);
		expect(snippet).not.toContain('\n  title=');
	});

	it('serializes quoted string values safely', () => {
		const snippet = buildPlaygroundSnippet('Settings', {
			...DEFAULT_PROPS,
			color: '#00ffaa',
			title: 'Gear "settings"'
		});

		expect(snippet).toContain('color="#00ffaa"');
		expect(snippet).toContain('title="Gear \\"settings\\""');
	});
});
