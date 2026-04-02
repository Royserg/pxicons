export const SITE_URL = 'https://pxicons.org';
export const SITE_NAME = 'pxicons';
export const SITE_TITLE = 'pxicons | Pixelart Lucide Icons';
export const SITE_DESCRIPTION =
	'Pixelart Lucide icons for Svelte, React, and vanilla JavaScript. Browse 1,700+ pixel-art Lucide SVG icons with install-ready snippets.';

export const SOCIAL_IMAGE_PATH = '/favicon.svg';

export function getCanonicalUrl(pathname: string): string {
	if (!pathname.startsWith('/')) {
		return `${SITE_URL}/${pathname}`;
	}

	return `${SITE_URL}${pathname}`;
}

export function joinKeywords(keywords: readonly string[]): string {
	return keywords.join(', ');
}

export function toJsonLdScript(schema: unknown): string {
	return `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`;
}
