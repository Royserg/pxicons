export function toComponentName(iconId: string): string {
	return iconId
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

export function buildSvelteSnippet(componentName: string): string {
	return `<script lang="ts">\n  import { ${componentName} } from '@pxicons/lucide-svelte';\n<\/script>\n\n<${componentName} size={24} color="currentColor" />`;
}

export function buildReactSnippet(componentName: string): string {
	return `import { ${componentName} } from '@pxicons/lucide-react';\n\nexport function App() {\n  return <${componentName} size={24} color="currentColor" />;\n}`;
}

export function buildVanillaSnippet(iconId: string): string {
	return `<script type="module">\n  import { createIcons } from '@pxicons/lucide';\n\n  createIcons();\n<\/script>\n\n<i data-px="lucide:${iconId}"></i>`;
}
