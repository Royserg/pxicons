import { describe, expect, it } from 'vite-plus/test';

import {
  buildTags,
  evaluateQuality,
  extractCellsFromPixelSvg,
  parseCliArgs,
  renderPixelSvg,
  resolveCanonicalIconIds,
  runConversion
} from './convert-lucide-to-pixel.mjs';

describe('convert-lucide-to-pixel cli', () => {
  it('parses dry-run, report, batching, and ids options', () => {
    const options = parseCliArgs([
      '--dry-run',
      '--report',
      './tmp/report.json',
      '--batch-start',
      '10',
      '--batch-size',
      '25',
      '--ids',
      'settings,house,circle-stop'
    ]);

    expect(options.dryRun).toBe(true);
    expect(options.report).toBe(true);
    expect(options.reportPath).toMatch(/tmp\/report\.json$/);
    expect(options.batchStart).toBe(10);
    expect(options.batchSize).toBe(25);
    expect(options.ids).toEqual(['settings', 'house', 'circle-stop']);
  });
});

describe('convert-lucide-to-pixel helpers', () => {
  it('resolves canonical ids deterministically', () => {
    const ids = resolveCanonicalIconIds({ z: [], a: [], m: [] });
    expect(ids).toEqual(['a', 'm', 'z']);
  });

  it('builds tags from id tokens + canonical tag map values', () => {
    const tags = buildTags('circle-stop', {
      'circle-stop': ['Pause', 'Media', 'Stop']
    });

    expect(tags).toContain('circle-stop');
    expect(tags).toContain('circle');
    expect(tags).toContain('stop');
    expect(tags).toContain('pause');
    expect(tags).toContain('media');
  });

  it('flags quality issues for empty/out-of-bounds/duplicate cells', () => {
    const quality = evaluateQuality([
      [0, 0],
      [0, 0],
      [25, 10]
    ]);

    expect(quality.issues.some((issue) => issue.includes('out-of-bounds'))).toBe(true);
    expect(quality.issues.some((issue) => issue.includes('duplicate'))).toBe(true);
  });

  it('serializes defs/use SVG with fixed 24x24 root attributes', () => {
    const svg = renderPixelSvg([
      { x: 3, y: 10, width: 2, height: 1 },
      { x: 9, y: 14, width: 1, height: 1 }
    ]);

    expect(svg).toContain('width="24"');
    expect(svg).toContain('height="24"');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('fill="currentColor"');
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<symbol id="px"');
    expect(svg).toContain('<use href="#px" x="3" y="10" width="2" height="1"/>');
    expect(svg).not.toContain('<rect x="3"');
  });

  it('extracts identical cells from legacy rect and defs/use run formats', () => {
    const legacyRectSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="3" y="10" width="2" height="1"/>
  <rect x="9" y="14" width="1" height="1"/>
</svg>`;
    const defsUseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges">
  <defs>
    <symbol id="px" viewBox="0 0 1 1" overflow="visible" preserveAspectRatio="none">
      <rect width="1" height="1" />
    </symbol>
  </defs>
  <use href="#px" x="3" y="10" width="2" height="1"/>
  <use href="#px" x="9" y="14" width="1" height="1"/>
</svg>`;

    expect(extractCellsFromPixelSvg(defsUseSvg)).toEqual(extractCellsFromPixelSvg(legacyRectSvg));
    expect(extractCellsFromPixelSvg(defsUseSvg)).toEqual([
      [3, 10],
      [4, 10],
      [9, 14]
    ]);
  });
});

describe('convert-lucide-to-pixel dry run', () => {
  it('discovers canonical source size and processes requested batch without writes', async () => {
    const report = await runConversion({
      dryRun: true,
      batchStart: 0,
      batchSize: 5
    });

    expect(report.summary.canonicalCount).toBe(1703);
    expect(report.summary.processedCount).toBe(5);
    expect(report.summary.skippedMissingSourceCount).toBe(0);
    expect(report.summary.acceptedCount).toBeGreaterThan(0);
  });
});
