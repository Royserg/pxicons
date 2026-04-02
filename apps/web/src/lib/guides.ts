export interface GuideDoc {
	slug: string;
	title: string;
	description: string;
}

export const guideDocs: readonly GuideDoc[] = [
	{
		slug: 'pixelart-lucide-icons',
		title: 'Pixelart Lucide Icons: Complete Guide',
		description:
			'How to pick, install, and ship pixelart Lucide icons with pxicons across modern frontend stacks.'
	},
	{
		slug: 'lucide-icons-svelte',
		title: 'Lucide Icons for Svelte',
		description: 'Use @pxicons/lucide-svelte to add pixelart Lucide icons to Svelte applications.'
	},
	{
		slug: 'lucide-icons-react',
		title: 'Lucide Icons for React',
		description: 'Use @pxicons/lucide-react to add pixelart Lucide icons to React applications.'
	},
	{
		slug: 'vanilla-lucide-pixel-icons',
		title: 'Vanilla Lucide Pixel Icons',
		description: 'Render pixelart Lucide SVG icons in plain JavaScript using @pxicons/lucide.'
	}
] as const;
