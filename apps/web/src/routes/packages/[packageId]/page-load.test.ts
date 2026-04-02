import { describe, expect, it } from 'vite-plus/test';
import { load } from './+page';

describe('package page load', () => {
	it('loads known package metadata', async () => {
		const data = await load({ params: { packageId: 'lucide-svelte' } } as never);
		if (!data) {
			throw new Error('Expected package load data');
		}

		expect(data.pkg.packageName).toBe('@pxicons/lucide-svelte');
		expect(data.pkg.installCommand).toContain('npm install');
	});

	it('throws for unknown package', () => {
		expect(() => load({ params: { packageId: 'unknown-package' } } as never)).toThrow();
	});
});
