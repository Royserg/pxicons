import { describe, expect, it } from 'vite-plus/test';

import { AlarmClockMinus, Icon, icons } from '../src/lucide/index';
import AlarmClockMinusDeep from '../src/lucide/icons/alarm-clock-minus';

describe('@pxicons/lucide-react export surface', () => {
  it('re-exports deep icon modules and icons namespace', () => {
    expect(AlarmClockMinus).toBe(AlarmClockMinusDeep);
    expect(icons.AlarmClockMinus).toBe(AlarmClockMinus);
  });

  it('exports Icon base component', () => {
    expect(Icon).toBeDefined();
  });
});
