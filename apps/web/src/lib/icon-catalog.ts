import { lucideIcons, type PixelIcon } from '@pxicons/lucide';

export type IconPackId = 'lucide';

export interface IconPackInfo {
	id: IconPackId;
	name: string;
	description: string;
	browserPath: string;
	categoryIndexPath: string;
	iconCount: number;
}

export interface CategoryInfo {
	packId: IconPackId;
	slug: string;
	tag: string;
	iconIds: readonly string[];
	iconCount: number;
}

export const allIcons: readonly PixelIcon[] = lucideIcons;
export const iconCount = allIcons.length;

export const iconPacks: readonly IconPackInfo[] = [
	{
		id: 'lucide',
		name: 'Lucide',
		description: 'Pixel-perfect Lucide icons for fast product UI work.',
		browserPath: '/icons/lucide',
		categoryIndexPath: '/icons/lucide/categories',
		iconCount
	}
] as const;

export const iconPacksById: ReadonlyMap<IconPackId, IconPackInfo> = new Map(
	iconPacks.map((pack) => [pack.id, pack])
);

export const iconsById: ReadonlyMap<string, PixelIcon> = new Map(
	allIcons.map((icon) => [icon.id, icon])
);

export function getIconPack(packId: string): IconPackInfo | undefined {
	if (packId === 'lucide') {
		return iconPacksById.get(packId);
	}

	return undefined;
}

export function getIconsForPack(packId: string): readonly PixelIcon[] {
	if (packId === 'lucide') {
		return allIcons;
	}

	return [];
}

export function getIconByPackAndId(packId: string, iconId: string): PixelIcon | undefined {
	if (packId !== 'lucide') {
		return undefined;
	}

	return iconsById.get(iconId);
}

export function getIconById(iconId: string): PixelIcon | undefined {
	return getIconByPackAndId('lucide', iconId);
}

export function slugifyTag(value: string): string {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');

	return normalized.length > 0 ? normalized : 'tag';
}

function buildCategories(packId: IconPackId, icons: readonly PixelIcon[]): readonly CategoryInfo[] {
	const tagToIcons = new Map<string, Set<string>>();

	for (const icon of icons) {
		const uniqueTags = new Set(icon.tags.map((tag) => tag.trim()).filter(Boolean));

		for (const tag of uniqueTags) {
			const existing = tagToIcons.get(tag) ?? new Set<string>();
			existing.add(icon.id);
			tagToIcons.set(tag, existing);
		}
	}

	const sortedEntries = [...tagToIcons.entries()].sort((a, b) => {
		const countDiff = b[1].size - a[1].size;
		if (countDiff !== 0) {
			return countDiff;
		}

		return a[0].localeCompare(b[0]);
	});

	const usedSlugs = new Set<string>();

	return sortedEntries.map(([tag, iconIdSet]) => {
		const iconIds = [...iconIdSet].sort((a, b) => a.localeCompare(b));
		const baseSlug = slugifyTag(tag);
		let slug = baseSlug;
		let suffix = 2;

		while (usedSlugs.has(slug)) {
			slug = `${baseSlug}-${suffix}`;
			suffix += 1;
		}

		usedSlugs.add(slug);

		return {
			packId,
			slug,
			tag,
			iconIds,
			iconCount: iconIds.length
		} as const;
	});
}

export const allCategories: readonly CategoryInfo[] = buildCategories('lucide', allIcons);

export const categoriesByPackAndSlug: ReadonlyMap<string, CategoryInfo> = new Map(
	allCategories.map((category) => [`${category.packId}:${category.slug}`, category])
);

export const categoriesByPackAndTag: ReadonlyMap<string, CategoryInfo> = new Map(
	allCategories.map((category) => [
		`${category.packId}:${category.tag.trim().toLowerCase()}`,
		category
	])
);

export function getCategoriesForPack(packId: string): readonly CategoryInfo[] {
	return allCategories.filter((category) => category.packId === packId);
}

export function getCategoryByPackAndSlug(packId: string, slug: string): CategoryInfo | undefined {
	return categoriesByPackAndSlug.get(`${packId}:${slug}`);
}

export function getCategoryByPackAndTag(packId: string, tag: string): CategoryInfo | undefined {
	return categoriesByPackAndTag.get(`${packId}:${tag.trim().toLowerCase()}`);
}

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
	return getCategoryByPackAndSlug('lucide', slug);
}

export function getIconsForCategory(packId: string, slug: string): readonly PixelIcon[] {
	const category = getCategoryByPackAndSlug(packId, slug);
	if (!category) {
		return [];
	}

	const iconsByPackId = packId === 'lucide' ? iconsById : new Map<string, PixelIcon>();

	return category.iconIds
		.map((iconId) => iconsByPackId.get(iconId))
		.filter((icon): icon is PixelIcon => Boolean(icon));
}

export function getTopCategories(
	limit = 16,
	minimumIcons = 8,
	packId: IconPackId = 'lucide'
): readonly CategoryInfo[] {
	return getCategoriesForPack(packId)
		.filter((category) => category.iconCount >= minimumIcons)
		.slice(0, limit);
}

export function getFeaturedIcons(limit = 12, packId: IconPackId = 'lucide'): readonly PixelIcon[] {
	const availableIcons = getIconsForPack(packId);
	const preferred = ['search', 'settings', 'house', 'bell', 'activity', 'badge-check', 'briefcase'];
	const selected = new Map<string, PixelIcon>();

	for (const iconId of preferred) {
		const icon = getIconByPackAndId(packId, iconId);
		if (icon) {
			selected.set(icon.id, icon);
		}
	}

	for (const icon of availableIcons) {
		if (selected.size >= limit) {
			break;
		}

		if (!selected.has(icon.id)) {
			selected.set(icon.id, icon);
		}
	}

	return [...selected.values()];
}

function normalizedTagSet(icon: PixelIcon): Set<string> {
	return new Set(icon.tags.map((tag) => tag.trim().toLowerCase()));
}

export function getRelatedIcons(icon: PixelIcon, limit = 12): readonly PixelIcon[] {
	const targetTags = normalizedTagSet(icon);
	const availableIcons = getIconsForPack(icon.library);

	return availableIcons
		.filter((candidate) => candidate.id !== icon.id)
		.map((candidate) => {
			const candidateTags = normalizedTagSet(candidate);
			let score = 0;

			for (const tag of targetTags) {
				if (candidateTags.has(tag)) {
					score += 1;
				}
			}

			return { candidate, score };
		})
		.filter((entry) => entry.score > 0)
		.sort((a, b) => {
			const scoreDiff = b.score - a.score;
			if (scoreDiff !== 0) {
				return scoreDiff;
			}

			return a.candidate.id.localeCompare(b.candidate.id);
		})
		.slice(0, limit)
		.map((entry) => entry.candidate);
}
