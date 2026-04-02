import { guideDocs } from '$lib/guides';

export interface GuideSection {
	heading: string;
	body: string;
	code?: string;
}

export interface GuideContent {
	slug: string;
	title: string;
	description: string;
	intro: string;
	sections: readonly GuideSection[];
}

const guideContentList: readonly GuideContent[] = [
	{
		slug: 'pixelart-lucide-icons',
		title: 'Pixelart Lucide Icons: Complete Guide',
		description:
			'Learn how to choose and ship pixelart Lucide icons in production using pxicons packages and crawlable icon docs.',
		intro:
			'pxicons turns the Lucide visual language into a consistent pixel-art icon system. This guide covers package selection, implementation patterns, and SEO-friendly page usage.',
		sections: [
			{
				heading: 'Choose your runtime package',
				body: 'Use @pxicons/lucide for DOM replacement, @pxicons/lucide-svelte for Svelte components, and @pxicons/lucide-react for React components.'
			},
			{
				heading: 'Link to icon-level docs',
				body: 'For search discoverability and developer UX, link to per-icon pages in /icons/lucide/[iconId] from your docs and changelogs.'
			},
			{
				heading: 'Use category pages for intent clusters',
				body: 'Category pages in /icons/lucide/categories/[tag] create keyword clusters that help rank icon queries without duplicating icon-level content.'
			}
		]
	},
	{
		slug: 'lucide-icons-svelte',
		title: 'Lucide Icons for Svelte',
		description: 'Install and use pixelart Lucide icons in Svelte with @pxicons/lucide-svelte.',
		intro:
			'The Svelte package exports typed icon components that support size, color, and shape customization while keeping pixel-grid output consistent.',
		sections: [
			{
				heading: 'Install',
				body: 'Add the package in your Svelte project and import icons directly from @pxicons/lucide-svelte.',
				code: `npm install @pxicons/lucide-svelte`
			},
			{
				heading: 'Render an icon',
				body: 'Use the component directly in markup. Props mirror the shared runtime API.',
				code: `<script lang="ts">\n  import { Search } from '@pxicons/lucide-svelte';\n<\/script>\n\n<Search size={24} color="currentColor" />`
			}
		]
	},
	{
		slug: 'lucide-icons-react',
		title: 'Lucide Icons for React',
		description: 'Install and use pixelart Lucide icons in React with @pxicons/lucide-react.',
		intro:
			'The React package exports component icons and supports tree-shakeable imports for production bundles.',
		sections: [
			{
				heading: 'Install',
				body: 'Add @pxicons/lucide-react to your React app.',
				code: `npm install @pxicons/lucide-react`
			},
			{
				heading: 'Render an icon component',
				body: 'Import icon components and pass sizing/color props.',
				code: `import { Search } from '@pxicons/lucide-react';\n\nexport function App() {\n  return <Search size={24} color="currentColor" />;\n}`
			}
		]
	},
	{
		slug: 'vanilla-lucide-pixel-icons',
		title: 'Vanilla Lucide Pixel Icons',
		description: 'Render pixelart Lucide icons in plain JavaScript with @pxicons/lucide.',
		intro:
			'The vanilla runtime scans for `data-px` attributes and replaces matching elements with generated SVG markup.',
		sections: [
			{
				heading: 'Install',
				body: 'Add @pxicons/lucide to your project.',
				code: `npm install @pxicons/lucide`
			},
			{
				heading: 'Boot createIcons()',
				body: 'Call createIcons after your DOM is ready, then use `data-px="lucide:icon-id"` markers.',
				code: `<script type="module">\n  import { createIcons } from '@pxicons/lucide';\n\n  createIcons();\n<\/script>\n\n<i data-px="lucide:search"></i>`
			}
		]
	}
] as const;

export const guideContentBySlug: ReadonlyMap<string, GuideContent> = new Map(
	guideContentList.map((guide) => [guide.slug, guide])
);

export function getGuideContent(slug: string): GuideContent | undefined {
	return guideContentBySlug.get(slug);
}

export const allGuideContent = guideContentList;

// Keep the short guide index list in sync with rich guide content.
for (const guide of guideDocs) {
	if (!guideContentBySlug.has(guide.slug)) {
		throw new Error(`Guide content missing for slug: ${guide.slug}`);
	}
}
