import { describe, expect, it } from 'vite-plus/test';

import {
  alarmClockMinus,
  createIcons,
  iconToSvg,
  icons,
  replaceElement
} from './index';
import alarmClockMinusDeep from './generated/icons/alarm-clock-minus';

describe('@pxicons/lucide vanilla runtime', () => {
  it('exports named icon definitions and default icons map', () => {
    expect(alarmClockMinus.id).toBe('alarm-clock-minus');
    expect(icons.alarmClockMinus.id).toBe('alarm-clock-minus');
    expect(alarmClockMinusDeep).toEqual(alarmClockMinus);
  });

  it('renders icon svg string with class names and pixels', () => {
    const svg = iconToSvg(alarmClockMinus, {
      size: 32,
      color: '#ffffff'
    });

    expect(svg).toContain('<svg ');
    expect(svg).toContain('width="32"');
    expect(svg).toContain('height="32"');
    expect(svg).toContain('class="pxicons-icon');
    expect(svg).toContain('lucide-alarm-clock-minus');
    expect(svg).toContain('<g fill="#ffffff">');
    expect(svg).toContain('aria-hidden="true"');
  });

  it('does not force aria-hidden when title is provided', () => {
    const svg = iconToSvg(alarmClockMinus, {
      title: 'Alarm icon'
    });

    expect(svg).toContain('<title>Alarm icon</title>');
    expect(svg).not.toContain('aria-hidden="true"');
  });

  it('replaces target elements using data-px and tolerant name normalization', () => {
    document.body.innerHTML = `
      <div id="root">
        <i id="kebab" class="alpha" data-px="lucide:alarm-clock-minus"></i>
        <i id="camel" data-px="lucide:alarmClockMinus"></i>
        <i id="pascal" data-px="lucide:AlarmClockMinus"></i>
        <i id="snake" data-px="lucide:alarm_clock_minus"></i>
      </div>
    `;

    const result = createIcons();

    expect(result.total).toBe(4);
    expect(result.replaced).toBe(4);
    expect(result.skipped).toBe(0);

    const root = document.getElementById('root');

    expect(root?.querySelectorAll('svg').length).toBe(4);
    expect(root?.querySelector('#kebab')?.tagName.toLowerCase()).toBe('svg');

    const firstSvg = root?.querySelector('svg.alpha');

    expect(firstSvg).toBeTruthy();
    expect(firstSvg?.getAttribute('class')).toContain('lucide-alarm-clock-minus');
  });

  it('warns and skips malformed or unknown entries', () => {
    const messages: string[] = [];

    document.body.innerHTML = `
      <div id="root">
        <i data-px="lucide"></i>
        <i data-px="unknown:alarm-clock-minus"></i>
        <i data-px="lucide:not-an-icon"></i>
      </div>
    `;

    const result = createIcons({
      warn: (message) => {
        messages.push(message);
      }
    });

    expect(result.total).toBe(3);
    expect(result.replaced).toBe(0);
    expect(result.skipped).toBe(3);
    expect(messages).toHaveLength(3);
    expect(messages[0]).toContain('malformed');
    expect(messages[1]).toContain('Unsupported icon library');
    expect(messages[2]).toContain('Unknown icon id');
  });

  it('preserves existing element attributes while replacing', () => {
    document.body.innerHTML = `<i id="target" class="beta" style="color: red" aria-label="custom" data-px="lucide:alarm-clock-minus"></i>`;
    const target = document.getElementById('target');

    if (!target) {
      throw new Error('Expected target element to exist.');
    }

    const svg = replaceElement(target, alarmClockMinus, {
      nameAttr: 'data-px'
    });

    expect(svg.getAttribute('style')).toContain('color: red');
    expect(svg.getAttribute('aria-label')).toBe('custom');
    expect(svg.getAttribute('class')).toContain('beta');
  });
});
