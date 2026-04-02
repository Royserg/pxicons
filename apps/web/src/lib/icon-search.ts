import type { PixelIcon } from '@pxicons/lucide';

export interface PixelIconSearchIndexEntry {
	icon: PixelIcon;
	searchableText: string;
}

function normalize(input: string): string {
	return input.trim().toLowerCase();
}

function createSearchableText(icon: PixelIcon): string {
	return [icon.id, icon.name, ...icon.tags].map(normalize).join('\n');
}

export function buildPixelIconSearchIndex(
	icons: readonly PixelIcon[]
): readonly PixelIconSearchIndexEntry[] {
	return icons.map((icon) => ({
		icon,
		searchableText: createSearchableText(icon)
	}));
}

export function filterIndexedPixelIcons(
	searchIndex: readonly PixelIconSearchIndexEntry[],
	query: string
): PixelIcon[] {
	const normalizedQuery = normalize(query);

	if (!normalizedQuery) {
		return searchIndex.map((entry) => entry.icon);
	}

	return searchIndex
		.filter((entry) => entry.searchableText.includes(normalizedQuery))
		.map((entry) => entry.icon);
}

export function filterPixelIcons(icons: readonly PixelIcon[], query: string): PixelIcon[] {
	return filterIndexedPixelIcons(buildPixelIconSearchIndex(icons), query);
}
