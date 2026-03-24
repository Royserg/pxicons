import { describe, expect, it } from 'vite-plus/test';

import { iconManifest } from '../../../icons/lucide/src/icon-manifest';
import * as iconComponents from '../src/lucide/icons/index';

function toPascalCase(iconId: string): string {
  return iconId
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

describe('@pxicons/lucide-react generated consistency', () => {
  it('keeps icon component exports aligned with canonical manifest', () => {
    const expectedNames = iconManifest
      .map((entry) => toPascalCase(entry.id))
      .sort((a, b) => a.localeCompare(b));
    const exportedNames = Object.keys(iconComponents).sort((a, b) => a.localeCompare(b));

    expect(exportedNames).toHaveLength(1703);
    expect(expectedNames).toHaveLength(1703);
    expect(exportedNames).toEqual(expectedNames);
  });

  it('includes representative icon component export', () => {
    expect('AlarmClockMinus' in iconComponents).toBe(true);
    expect(iconComponents.AlarmClockMinus).toBeDefined();
  });
});
