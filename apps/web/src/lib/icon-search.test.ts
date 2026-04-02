import { describe, expect, it } from 'vite-plus/test';
import { lucideIcons } from '@pxicons/lucide';
import {
	buildPixelIconSearchIndex,
	filterIndexedPixelIcons,
	filterPixelIcons
} from './icon-search';

describe('filterPixelIcons', () => {
	it('returns all icons for empty query', () => {
		expect(filterPixelIcons(lucideIcons, '')).toEqual(lucideIcons);
	});

	it('matches icon id case-insensitively', () => {
		const matches = filterPixelIcons(lucideIcons, 'SETTINGS');
		expect(matches.length).toBeGreaterThan(0);
		expect(matches.some((icon) => icon.id === 'settings')).toBe(true);
	});

	it('matches icon name and tags', () => {
		expect(filterPixelIcons(lucideIcons, 'pref').some((icon) => icon.id === 'settings')).toBe(true);
		expect(filterPixelIcons(lucideIcons, 'gear').some((icon) => icon.id === 'settings')).toBe(true);
	});

	it('reuses a prebuilt search index for repeated queries', () => {
		const searchIndex = buildPixelIconSearchIndex(lucideIcons);

		expect(
			filterIndexedPixelIcons(searchIndex, 'pref').some((icon) => icon.id === 'settings')
		).toBe(true);
		expect(
			filterIndexedPixelIcons(searchIndex, 'gear').some((icon) => icon.id === 'settings')
		).toBe(true);
	});
});
