import { describe, expect, it } from 'vite-plus/test';
import { load } from './+page';

describe('legacy category route', () => {
	it('redirects to the pack-scoped Lucide category page', () => {
		try {
			load({ params: { tag: 'delete' } } as never);
			throw new Error('Expected redirect');
		} catch (error) {
			expect(error).toMatchObject({
				status: 308,
				location: '/icons/lucide/categories/delete'
			});
		}
	});
});
