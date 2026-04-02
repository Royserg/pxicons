import { describe, expect, it } from 'vite-plus/test';
import { GET } from './+server';

describe('sitemap.xml endpoint', () => {
	it('returns XML with key SEO URLs', async () => {
		const response = await GET({} as never);
		const body = await response.text();

		expect(response.headers.get('content-type')).toContain('application/xml');
		expect(body).toContain('<urlset');
		expect(body).toContain('https://pxicons.org/pixelart-lucide-icons');
		expect(body).toContain('https://pxicons.org/packages/lucide-svelte');
		expect(body).toContain('https://pxicons.org/icons/lucide');
		expect(body).toContain('https://pxicons.org/icons/lucide/categories/delete');
		expect(body).toContain('https://pxicons.org/icons/lucide/search');
	});
});
