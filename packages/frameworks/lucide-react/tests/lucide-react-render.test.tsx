import { describe, expect, it } from 'vite-plus/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { AlarmClockMinus, Icon } from '../src/lucide/index';

describe('@pxicons/lucide-react rendering', () => {
  it('renders optimized output with classes and aria defaults', () => {
    const markup = renderToStaticMarkup(
      <AlarmClockMinus size={32} color="#ffffff" className="alpha" />
    );

    expect(markup).toContain('<svg');
    expect(markup).toContain('width="32"');
    expect(markup).toContain('height="32"');
    expect(markup).toContain('class="pxicons-icon lucide-icon lucide lucide-alarm-clock-minus pxicons-alarm-clock-minus alpha"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('<path d="');
  });

  it('switches to raw mode and shape-specific primitives', () => {
    const rounded = renderToStaticMarkup(
      <AlarmClockMinus renderMode="raw" shape="rounded" />
    );

    const circle = renderToStaticMarkup(
      <AlarmClockMinus renderMode="raw" shape="circle" />
    );

    expect(rounded).toContain('<rect');
    expect(rounded).toContain('rx="');
    expect(circle).toContain('<circle');
  });

  it('keeps explicit accessibility metadata and title', () => {
    const markup = renderToStaticMarkup(
      <AlarmClockMinus title="Alarm" aria-label="Alarm icon" />
    );

    expect(markup).toContain('<title>Alarm</title>');
    expect(markup).toContain('aria-label="Alarm icon"');
    expect(markup).not.toContain('aria-hidden="true"');
  });

  it('renders from Icon base when icon geometry is passed directly', () => {
    const markup = renderToStaticMarkup(
      <Icon
        name="custom"
        iconPixels={[[1, 1], [2, 1]]}
        iconRects={[[1, 1, 2, 1]]}
        renderMode="optimized"
      />
    );

    expect(markup).toContain('lucide-custom');
    expect(markup).toContain('<path d="');
  });
});
