import { describe, expect, it } from 'vite-plus/test';
import { lucideIcons } from '@pxicons/lucide';
import { filterPixelIcons } from './icon-search';

describe('filterPixelIcons', () => {
	it('returns all icons for empty query', () => {
		expect(filterPixelIcons(lucideIcons, '')).toEqual(lucideIcons);
	});

	it('matches icon id case-insensitively', () => {
		const matches = filterPixelIcons(lucideIcons, 'SETTINGS');
		expect(matches).toHaveLength(1);
		expect(matches[0]?.id).toBe('settings');
	});

	it('matches icon name and tags', () => {
		expect(filterPixelIcons(lucideIcons, 'pref')).toHaveLength(1);
		expect(filterPixelIcons(lucideIcons, 'gear')).toHaveLength(1);
	});
});
