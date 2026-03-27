import { describe, expect, it } from 'vite-plus/test';

import { iconManifest } from './icon-manifest';
import { iconsById } from './generated/icons/registry';

describe('@pxicons/lucide generated runtime consistency', () => {
  it('keeps generated icon definitions in sync with canonical manifest', () => {
    const manifestIds = iconManifest.map((entry) => entry.id).sort((a, b) => a.localeCompare(b));
    const generatedIds = Object.keys(iconsById).sort((a, b) => a.localeCompare(b));

    expect(generatedIds).toHaveLength(1703);
    expect(manifestIds).toHaveLength(1703);
    expect(generatedIds).toEqual(manifestIds);
  });

  it('includes representative icon geometry for alarm-clock-minus', () => {
    const icon = iconsById['alarm-clock-minus'];

    expect(icon).toBeTruthy();
    expect(icon.id).toBe('alarm-clock-minus');
    expect(icon.iconPixels.length).toBeGreaterThan(0);
    expect(icon.iconRects.length).toBeGreaterThan(0);
  });
});
