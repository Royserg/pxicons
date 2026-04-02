import { describe, expect, it } from 'vite-plus/test';
import { load } from './+page';

describe('pack-scoped Lucide category page load', () => {
	it('loads a known category', async () => {
		const data = await load({ params: { tag: 'delete' } } as never);
		if (!data) {
			throw new Error('Expected category load data');
		}

		expect(data.category.slug).toBe('delete');
		expect(data.category.packId).toBe('lucide');
		expect(data.icons.length).toBeGreaterThan(0);
		expect(data.topCategories.length).toBeGreaterThan(0);
	});

	it('throws for unknown category', () => {
		expect(() => load({ params: { tag: 'unknown-category-slug' } } as never)).toThrow();
	});
});
