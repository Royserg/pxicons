import { describe, expect, it } from 'vite-plus/test';
import { load } from './+page';

describe('pack-scoped Lucide icon detail load', () => {
	it('loads known icon data', async () => {
		const data = await load({ params: { iconId: 'search' } } as never);
		if (!data) {
			throw new Error('Expected icon load data');
		}

		expect(data.icon.id).toBe('search');
		expect(data.icon.library).toBe('lucide');
		expect(data.relatedIcons.length).toBeGreaterThan(0);
		expect(data.tagLinks.length).toBeGreaterThan(0);
		expect(data.svelteSnippet).toContain('@pxicons/lucide-svelte');
	});

	it('throws 404 for unknown icon', () => {
		expect(() => load({ params: { iconId: 'does-not-exist' } } as never)).toThrow();
	});
});
