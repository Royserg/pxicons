import { describe, expect, it } from 'vite-plus/test';
import { load } from './+page';

describe('guide page load', () => {
	it('loads known guide', async () => {
		const data = await load({ params: { slug: 'lucide-icons-svelte' } } as never);
		if (!data) {
			throw new Error('Expected guide load data');
		}

		expect(data.guide.slug).toBe('lucide-icons-svelte');
		expect(data.guide.sections.length).toBeGreaterThan(0);
	});

	it('throws for unknown guide', () => {
		expect(() => load({ params: { slug: 'nope' } } as never)).toThrow();
	});
});
