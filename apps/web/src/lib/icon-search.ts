import type { PixelIcon } from '@pxicons/lucide';

function normalize(input: string): string {
	return input.trim().toLowerCase();
}

export function filterPixelIcons(icons: readonly PixelIcon[], query: string): PixelIcon[] {
	const normalizedQuery = normalize(query);

	if (!normalizedQuery) {
		return [...icons];
	}

	return icons.filter((icon) => {
		const name = normalize(icon.name);
		const id = normalize(icon.id);

		if (name.includes(normalizedQuery) || id.includes(normalizedQuery)) {
			return true;
		}

		return icon.tags.some((tag) => normalize(tag).includes(normalizedQuery));
	});
}
