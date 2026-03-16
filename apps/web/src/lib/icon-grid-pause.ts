import type { PixelIcon } from '@pxicons/lucide';

export function resolveGridIconsSnapshot(
	drawerOpen: boolean,
	filteredIcons: readonly PixelIcon[],
	previousSnapshot: readonly PixelIcon[]
): readonly PixelIcon[] {
	if (drawerOpen) {
		return previousSnapshot;
	}

	return filteredIcons;
}
