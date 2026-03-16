import { describe, expect, it } from 'vite-plus/test';
import { getLucideIcon, type PixelIcon } from '@pxicons/lucide';
import { resolveGridIconsSnapshot } from './icon-grid-pause';

function requireIcon(id: string): PixelIcon {
	const icon = getLucideIcon(id);

	if (!icon) {
		throw new Error(`Expected icon fixture "${id}" to exist`);
	}

	return icon;
}

describe('resolveGridIconsSnapshot', () => {
	it('freezes the rendered grid list while drawer is open', () => {
		const settings = requireIcon('settings');
		const search = requireIcon('search');
		const alarm = requireIcon('alarm-clock');

		const initial = [settings, search];
		const filteredWhileOpen = [alarm];
		const frozen = resolveGridIconsSnapshot(true, filteredWhileOpen, initial);

		expect(frozen).toBe(initial);
		expect(frozen).toEqual([settings, search]);
	});

	it('resumes live filtered icons after drawer closes', () => {
		const settings = requireIcon('settings');
		const search = requireIcon('search');
		const alarm = requireIcon('alarm-clock');

		const initial = [settings, search];
		const updated = [alarm];
		const resumed = resolveGridIconsSnapshot(false, updated, initial);

		expect(resumed).toBe(updated);
		expect(resumed).toEqual([alarm]);
	});
});
