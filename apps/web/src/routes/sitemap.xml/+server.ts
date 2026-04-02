import { allCategories, allIcons } from '$lib/icon-catalog';
import { guideDocs } from '$lib/guides';
import { packageDocs } from '$lib/package-docs';
import { getCanonicalUrl } from '$lib/site';
import type { RequestHandler } from './$types';

const STATIC_PATHS = [
	'/',
	'/pixelart-lucide-icons',
	'/icons',
	'/icons/lucide',
	'/icons/lucide/categories',
	'/packages',
	'/guides'
] as const;

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toUrlNode(path: string, lastmod: string): string {
	const url = getCanonicalUrl(path);

	return `<url><loc>${xmlEscape(url)}</loc><lastmod>${lastmod}</lastmod></url>`;
}

export const GET: RequestHandler = () => {
	const lastmod = new Date().toISOString();

	const paths = [
		...STATIC_PATHS,
		...packageDocs.map((pkg) => `/packages/${pkg.id}`),
		...guideDocs.map((guide) => `/guides/${guide.slug}`),
		...allCategories.map((category) => `/icons/${category.packId}/categories/${category.slug}`),
		...allIcons.map((icon) => `/icons/${icon.library}/${icon.id}`)
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
		.map((path) => toUrlNode(path, lastmod))
		.join('')}</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'max-age=0, s-maxage=3600'
		}
	});
};
