import { describe, expect, it } from 'vite-plus/test';
import { load } from './+page';

describe('legacy icon detail route', () => {
	it('redirects to the pack-scoped Lucide detail page', () => {
		try {
			load({ params: { iconId: 'search' } } as never);
			throw new Error('Expected redirect');
		} catch (error) {
			expect(error).toMatchObject({
				status: 308,
				location: '/icons/lucide/search'
			});
		}
	});
});
