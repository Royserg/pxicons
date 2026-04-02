export interface PackageDoc {
	id: 'lucide' | 'lucide-svelte' | 'lucide-react';
	packageName: '@pxicons/lucide' | '@pxicons/lucide-svelte' | '@pxicons/lucide-react';
	title: string;
	description: string;
	framework: string;
	installCommand: string;
	usageSnippet: string;
	keywords: readonly string[];
}

export const packageDocs: readonly PackageDoc[] = [
	{
		id: 'lucide',
		packageName: '@pxicons/lucide',
		title: 'Pixelart Lucide Icons for Vanilla JavaScript',
		description:
			'Use @pxicons/lucide to render pixelart Lucide icons directly in the DOM with a data attribute API.',
		framework: 'Vanilla JavaScript',
		installCommand: 'npm install @pxicons/lucide',
		usageSnippet: `<script type="module">\n  import { createIcons } from '@pxicons/lucide';\n\n  createIcons();\n<\/script>\n\n<i data-px="lucide:search"></i>`,
		keywords: ['pixelart lucide icons', 'pixel art icons', 'vanilla javascript icons', 'svg icons']
	},
	{
		id: 'lucide-svelte',
		packageName: '@pxicons/lucide-svelte',
		title: 'Pixelart Lucide Icons for Svelte',
		description:
			'Use @pxicons/lucide-svelte for typed Svelte components powered by the pxicons pixelart Lucide icon set.',
		framework: 'Svelte',
		installCommand: 'npm install @pxicons/lucide-svelte',
		usageSnippet: `<script lang="ts">\n  import { Search } from '@pxicons/lucide-svelte';\n<\/script>\n\n<Search size={24} color="currentColor" />`,
		keywords: [
			'pixelart lucide icons',
			'svelte icons',
			'svelte lucide icons',
			'pixel art svelte components'
		]
	},
	{
		id: 'lucide-react',
		packageName: '@pxicons/lucide-react',
		title: 'Pixelart Lucide Icons for React',
		description:
			'Use @pxicons/lucide-react for React icon components generated from the pxicons pixelart Lucide catalog.',
		framework: 'React',
		installCommand: 'npm install @pxicons/lucide-react',
		usageSnippet: `import { Search } from '@pxicons/lucide-react';\n\nexport function App() {\n  return <Search size={24} color="currentColor" />;\n}`,
		keywords: [
			'pixelart lucide icons',
			'react icons',
			'react lucide icons',
			'pixel art react components'
		]
	}
] as const;

export const packageDocsById: ReadonlyMap<PackageDoc['id'], PackageDoc> = new Map(
	packageDocs.map((doc) => [doc.id, doc])
);

export function getPackageDoc(id: string): PackageDoc | undefined {
	if (id === 'lucide' || id === 'lucide-svelte' || id === 'lucide-react') {
		return packageDocsById.get(id);
	}

	return undefined;
}
