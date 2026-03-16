import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { svgPathProperties } from 'svg-path-properties';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const sourceDir = path.join(packageDir, 'node_modules/lucide-static/icons');
const tagsPath = path.join(packageDir, 'node_modules/lucide-static/tags.json');
const manifestPath = path.join(packageDir, 'src/icon-manifest.ts');
const pixelMapPath = path.join(packageDir, 'src/pixel-map.ts');
const defaultReportPath = path.join(packageDir, 'reports/conversion-report.json');

const NO_OVERWRITE = new Set(['settings']);
const SHAPE_TAGS = new Set(['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect']);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true
});

const QUALITY_RULES = Object.freeze({
  minPixels: 4,
  maxPixels: 560,
  minFillRatio: 0.005,
  maxFillRatio: 0.92
});

function titleCaseFromId(id) {
  return id
    .split('-')
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      if (/^\d/.test(segment)) {
        return segment;
      }

      return segment[0].toUpperCase() + segment.slice(1);
    })
    .join(' ');
}

function parseNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeList(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseViewBox(viewBox) {
  const values = String(viewBox || '0 0 24 24')
    .trim()
    .split(/\s+/)
    .map((chunk) => Number.parseFloat(chunk));

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return [0, 0, 24, 24];
  }

  return [values[0], values[1], values[2], values[3]];
}

function createGrid(size = 24) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false));
}

function stampPixel(grid, x, y, radius) {
  const minX = Math.floor(x - radius);
  const maxX = Math.ceil(x + radius);
  const minY = Math.floor(y - radius);
  const maxY = Math.ceil(y + radius);
  const radiusSquared = radius * radius;

  for (let gy = minY; gy <= maxY; gy += 1) {
    if (gy < 0 || gy >= grid.length) {
      continue;
    }

    for (let gx = minX; gx <= maxX; gx += 1) {
      if (gx < 0 || gx >= grid[gy].length) {
        continue;
      }

      const dx = gx + 0.5 - x;
      const dy = gy + 0.5 - y;

      if (dx * dx + dy * dy <= radiusSquared) {
        grid[gy][gx] = true;
      }
    }
  }
}

function drawSegment(grid, x1, y1, x2, y2, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const steps = Math.max(2, Math.ceil(length * 5));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    stampPixel(grid, x1 + dx * t, y1 + dy * t, radius);
  }
}

function parsePointPairs(pointsText) {
  const normalized = String(pointsText || '')
    .trim()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((chunk) => Number.parseFloat(chunk))
    .filter((value) => Number.isFinite(value));

  const points = [];

  for (let i = 0; i + 1 < normalized.length; i += 2) {
    points.push([normalized[i], normalized[i + 1]]);
  }

  return points;
}

function fillRect(grid, x, y, width, height) {
  const minX = Math.floor(x);
  const maxX = Math.ceil(x + width);
  const minY = Math.floor(y);
  const maxY = Math.ceil(y + height);

  for (let gy = minY; gy < maxY; gy += 1) {
    if (gy < 0 || gy >= grid.length) {
      continue;
    }

    for (let gx = minX; gx < maxX; gx += 1) {
      if (gx < 0 || gx >= grid[gy].length) {
        continue;
      }

      grid[gy][gx] = true;
    }
  }
}

function collectShapes(svgNode) {
  const shapes = [];

  for (const [key, value] of Object.entries(svgNode)) {
    if (!SHAPE_TAGS.has(key)) {
      continue;
    }

    const entries = normalizeList(value);

    for (const entry of entries) {
      shapes.push({
        tag: key,
        attrs: entry
      });
    }
  }

  return shapes;
}

function buildPixelGrid(svgContent) {
  const parsed = parser.parse(svgContent);
  const svgNode = parsed.svg;

  if (!svgNode) {
    throw new Error('Invalid SVG: root <svg> not found.');
  }

  const [viewMinX, viewMinY, viewWidth, viewHeight] = parseViewBox(svgNode.viewBox);
  const scaleX = 24 / viewWidth;
  const scaleY = 24 / viewHeight;
  const avgScale = (scaleX + scaleY) / 2;
  const defaultStrokeWidth = parseNumber(svgNode['stroke-width'], 2);

  const toGridX = (value) => (value - viewMinX) * scaleX;
  const toGridY = (value) => (value - viewMinY) * scaleY;

  const grid = createGrid(24);
  const shapes = collectShapes(svgNode);

  for (const shape of shapes) {
    const attrs = shape.attrs;
    const strokeWidth = parseNumber(attrs['stroke-width'] ?? defaultStrokeWidth, defaultStrokeWidth);
    const radius = Math.max(0.65, strokeWidth * avgScale * 0.52);
    const fill = attrs.fill ?? svgNode.fill ?? 'none';
    const hasFill = fill !== 'none' && fill !== 'transparent';

    if (shape.tag === 'line') {
      const x1 = toGridX(parseNumber(attrs.x1));
      const y1 = toGridY(parseNumber(attrs.y1));
      const x2 = toGridX(parseNumber(attrs.x2));
      const y2 = toGridY(parseNumber(attrs.y2));
      drawSegment(grid, x1, y1, x2, y2, radius);
      continue;
    }

    if (shape.tag === 'polyline' || shape.tag === 'polygon') {
      const points = parsePointPairs(attrs.points);
      for (let i = 0; i + 1 < points.length; i += 1) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        drawSegment(grid, toGridX(x1), toGridY(y1), toGridX(x2), toGridY(y2), radius);
      }

      if (shape.tag === 'polygon' && points.length > 2) {
        const [x1, y1] = points[points.length - 1];
        const [x2, y2] = points[0];
        drawSegment(grid, toGridX(x1), toGridY(y1), toGridX(x2), toGridY(y2), radius);
      }

      continue;
    }

    if (shape.tag === 'circle') {
      const cx = toGridX(parseNumber(attrs.cx));
      const cy = toGridY(parseNumber(attrs.cy));
      const rx = parseNumber(attrs.r) * scaleX;
      const ry = parseNumber(attrs.r) * scaleY;
      const steps = Math.max(16, Math.ceil(2 * Math.PI * Math.max(rx, ry) * 5));

      for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(t) * rx;
        const y = cy + Math.sin(t) * ry;
        stampPixel(grid, x, y, radius);
      }

      if (hasFill) {
        for (let gy = 0; gy < 24; gy += 1) {
          for (let gx = 0; gx < 24; gx += 1) {
            const dx = (gx + 0.5 - cx) / rx;
            const dy = (gy + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1) {
              grid[gy][gx] = true;
            }
          }
        }
      }

      continue;
    }

    if (shape.tag === 'ellipse') {
      const cx = toGridX(parseNumber(attrs.cx));
      const cy = toGridY(parseNumber(attrs.cy));
      const rx = parseNumber(attrs.rx) * scaleX;
      const ry = parseNumber(attrs.ry) * scaleY;
      const steps = Math.max(16, Math.ceil(2 * Math.PI * Math.max(rx, ry) * 5));

      for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(t) * rx;
        const y = cy + Math.sin(t) * ry;
        stampPixel(grid, x, y, radius);
      }

      if (hasFill) {
        for (let gy = 0; gy < 24; gy += 1) {
          for (let gx = 0; gx < 24; gx += 1) {
            const dx = (gx + 0.5 - cx) / rx;
            const dy = (gy + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1) {
              grid[gy][gx] = true;
            }
          }
        }
      }

      continue;
    }

    if (shape.tag === 'rect') {
      const x = toGridX(parseNumber(attrs.x));
      const y = toGridY(parseNumber(attrs.y));
      const width = parseNumber(attrs.width) * scaleX;
      const height = parseNumber(attrs.height) * scaleY;
      const x2 = x + width;
      const y2 = y + height;

      drawSegment(grid, x, y, x2, y, radius);
      drawSegment(grid, x2, y, x2, y2, radius);
      drawSegment(grid, x2, y2, x, y2, radius);
      drawSegment(grid, x, y2, x, y, radius);

      if (hasFill) {
        fillRect(grid, x, y, width, height);
      }

      continue;
    }

    if (shape.tag === 'path') {
      const d = attrs.d;
      if (!d) {
        continue;
      }

      const pathProperties = new svgPathProperties(d);
      const length = pathProperties.getTotalLength();
      const steps = Math.max(20, Math.ceil(length * avgScale * 5));

      for (let i = 0; i <= steps; i += 1) {
        const point = pathProperties.getPointAtLength((i / steps) * length);
        stampPixel(grid, toGridX(point.x), toGridY(point.y), radius);
      }

      continue;
    }
  }

  return grid;
}

function bridgeGaps(grid) {
  const next = grid.map((row) => [...row]);

  for (let y = 1; y < grid.length - 1; y += 1) {
    for (let x = 1; x < grid[y].length - 1; x += 1) {
      if (grid[y][x]) {
        continue;
      }

      const horizontal = grid[y][x - 1] && grid[y][x + 1];
      const vertical = grid[y - 1][x] && grid[y + 1][x];
      const diagonalA = grid[y - 1][x - 1] && grid[y + 1][x + 1];
      const diagonalB = grid[y - 1][x + 1] && grid[y + 1][x - 1];

      if (horizontal || vertical || diagonalA || diagonalB) {
        next[y][x] = true;
      }
    }
  }

  return next;
}

function removeIsolatedPixels(grid) {
  const next = grid.map((row) => [...row]);

  for (let y = 1; y < grid.length - 1; y += 1) {
    for (let x = 1; x < grid[y].length - 1; x += 1) {
      if (!grid[y][x]) {
        continue;
      }

      let neighbors = 0;

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }

          if (grid[y + dy][x + dx]) {
            neighbors += 1;
          }
        }
      }

      if (neighbors <= 1) {
        next[y][x] = false;
      }
    }
  }

  return next;
}

function gridToRects(grid) {
  const rects = [];

  for (let y = 0; y < grid.length; y += 1) {
    let x = 0;

    while (x < grid[y].length) {
      if (!grid[y][x]) {
        x += 1;
        continue;
      }

      let end = x + 1;
      while (end < grid[y].length && grid[y][end]) {
        end += 1;
      }

      rects.push({ x, y, width: end - x, height: 1 });
      x = end;
    }
  }

  return rects;
}

function gridToPixelCells(grid) {
  const cells = [];

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x]) {
        cells.push([x, y]);
      }
    }
  }

  return cells;
}

function renderPixelSvg(rects) {
  const lines = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'];

  for (const rect of rects) {
    lines.push(`  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="1"/>`);
  }

  lines.push('</svg>');

  return `${lines.join('\n')}\n`;
}

function extractCellsFromPixelSvg(svgContent) {
  const parsed = parser.parse(svgContent);
  const svgNode = parsed.svg;

  if (!svgNode?.rect) {
    return [];
  }

  const rects = normalizeList(svgNode.rect);
  const seen = new Set();

  for (const rect of rects) {
    const startX = Math.round(parseNumber(rect.x, 0));
    const startY = Math.round(parseNumber(rect.y, 0));
    const width = Math.max(1, Math.round(parseNumber(rect.width, 1)));
    const height = Math.max(1, Math.round(parseNumber(rect.height, 1)));

    for (let y = startY; y < startY + height; y += 1) {
      if (y < 0 || y >= 24) {
        continue;
      }

      for (let x = startX; x < startX + width; x += 1) {
        if (x < 0 || x >= 24) {
          continue;
        }

        seen.add(`${x},${y}`);
      }
    }
  }

  return [...seen]
    .map((cell) => {
      const [x, y] = cell.split(',').map((value) => Number.parseInt(value, 10));
      return [x, y];
    })
    .sort(([ax, ay], [bx, by]) => ay - by || ax - bx);
}

function sanitizeTag(tag) {
  return String(tag || '').trim().toLowerCase();
}

export function buildTags(id, canonicalTagMap) {
  const words = id
    .split('-')
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

  const canonicalTags = normalizeList(canonicalTagMap[id]).map(sanitizeTag).filter(Boolean);
  const tags = new Set([id, ...words, ...canonicalTags]);

  return [...tags];
}

function createIconMetrics(pixelCells) {
  const totalPixels = pixelCells.length;
  const fillRatio = totalPixels / (24 * 24);

  if (!totalPixels) {
    return {
      totalPixels,
      fillRatio,
      minX: null,
      minY: null,
      maxX: null,
      maxY: null,
      width: 0,
      height: 0
    };
  }

  let minX = 24;
  let minY = 24;
  let maxX = 0;
  let maxY = 0;

  for (const [x, y] of pixelCells) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    totalPixels,
    fillRatio,
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

export function evaluateQuality(pixelCells) {
  const issues = [];
  const seen = new Set();
  let outOfBounds = 0;
  let duplicates = 0;

  for (const cell of pixelCells) {
    const [x, y] = cell;

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      issues.push('non-integer cell coordinate');
      continue;
    }

    if (x < 0 || x > 23 || y < 0 || y > 23) {
      outOfBounds += 1;
    }

    const key = `${x},${y}`;
    if (seen.has(key)) {
      duplicates += 1;
    }

    seen.add(key);
  }

  const metrics = createIconMetrics(pixelCells);

  if (metrics.totalPixels === 0) {
    issues.push('empty pixel output');
  }

  if (metrics.totalPixels < QUALITY_RULES.minPixels) {
    issues.push(`pixel count too low (< ${QUALITY_RULES.minPixels})`);
  }

  if (metrics.totalPixels > QUALITY_RULES.maxPixels) {
    issues.push(`pixel count too high (> ${QUALITY_RULES.maxPixels})`);
  }

  if (metrics.fillRatio < QUALITY_RULES.minFillRatio) {
    issues.push(`fill ratio too low (< ${QUALITY_RULES.minFillRatio})`);
  }

  if (metrics.fillRatio > QUALITY_RULES.maxFillRatio) {
    issues.push(`fill ratio too high (> ${QUALITY_RULES.maxFillRatio})`);
  }

  if (outOfBounds > 0) {
    issues.push(`out-of-bounds cells (${outOfBounds})`);
  }

  if (duplicates > 0) {
    issues.push(`duplicate cells (${duplicates})`);
  }

  return {
    issues,
    metrics
  };
}

function parseIntegerArg(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const options = {
    dryRun: false,
    report: false,
    reportPath: undefined,
    batchStart: 0,
    batchSize: undefined,
    ids: undefined
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--report') {
      options.report = true;
      const maybePath = argv[i + 1];

      if (maybePath && !maybePath.startsWith('--')) {
        options.reportPath = path.resolve(process.cwd(), maybePath);
        i += 1;
      }

      continue;
    }

    if (arg === '--batch-start') {
      options.batchStart = Math.max(0, parseIntegerArg(argv[i + 1], 0));
      i += 1;
      continue;
    }

    if (arg === '--batch-size') {
      options.batchSize = Math.max(1, parseIntegerArg(argv[i + 1], 1));
      i += 1;
      continue;
    }

    if (arg === '--ids') {
      const raw = argv[i + 1] ?? '';
      options.ids = raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

async function loadCanonicalTagMap() {
  const raw = await fs.readFile(tagsPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid lucide-static tags.json format.');
  }

  return parsed;
}

export function resolveCanonicalIconIds(canonicalTagMap) {
  return Object.keys(canonicalTagMap).sort((a, b) => a.localeCompare(b));
}

function resolveIdsToProcess(canonicalIds, options) {
  if (options.ids?.length) {
    const canonicalSet = new Set(canonicalIds);

    return options.ids.filter((id) => canonicalSet.has(id)).sort((a, b) => a.localeCompare(b));
  }

  if (options.batchStart === 0 && options.batchSize >= canonicalIds.length) {
    return [...canonicalIds];
  }

  const start = Math.min(options.batchStart, canonicalIds.length);
  const end = Math.min(start + options.batchSize, canonicalIds.length);

  return canonicalIds.slice(start, end);
}

function evaluateTsModule(source, exportName) {
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, Object, Array, String, Number, Boolean });
  const script = new vm.Script(`${source}\nmodule.exports = { ${exportName} };`);
  script.runInContext(context);
  return module.exports[exportName];
}

async function readExistingManifestMap(canonicalIdSet) {
  try {
    let source = await fs.readFile(manifestPath, 'utf8');

    source = source
      .replace(/export interface[\s\S]*?}\n\n/g, '')
      .replace(/export type[^\n]*\n/g, '')
      .replace(/export const iconManifest\s*:[^=]+=/, 'const iconManifest =');

    const manifest = evaluateTsModule(source, 'iconManifest');

    if (!Array.isArray(manifest)) {
      return new Map();
    }

    const map = new Map();

    for (const entry of manifest) {
      if (!entry?.id || !canonicalIdSet.has(entry.id)) {
        continue;
      }

      map.set(entry.id, {
        id: entry.id,
        name: entry.name,
        tags: Array.isArray(entry.tags) ? entry.tags : []
      });
    }

    return map;
  } catch {
    return new Map();
  }
}

async function readExistingPixelMap(canonicalIdSet) {
  try {
    let source = await fs.readFile(pixelMapPath, 'utf8');

    source = source
      .replace(/export type[^\n]*\n/g, '')
      .replace(/export const lucidePixelMap\s*:[^=]+=/, 'const lucidePixelMap =');

    const pixelMap = evaluateTsModule(source, 'lucidePixelMap');

    if (!pixelMap || typeof pixelMap !== 'object') {
      return new Map();
    }

    const map = new Map();

    for (const [id, cells] of Object.entries(pixelMap)) {
      if (!canonicalIdSet.has(id)) {
        continue;
      }

      map.set(id, Array.isArray(cells) ? cells : []);
    }

    return map;
  } catch {
    return new Map();
  }
}

async function readExistingEntryMap(canonicalIds) {
  const canonicalSet = new Set(canonicalIds);
  const [manifestMap, pixelMap] = await Promise.all([
    readExistingManifestMap(canonicalSet),
    readExistingPixelMap(canonicalSet)
  ]);

  const entries = new Map();

  for (const id of canonicalIds) {
    const manifestEntry = manifestMap.get(id);
    const pixelCells = pixelMap.get(id);

    if (!manifestEntry || !pixelCells) {
      continue;
    }

    entries.set(id, {
      id,
      name: manifestEntry.name,
      tags: manifestEntry.tags,
      pixelCells
    });
  }

  return entries;
}

function serializeManifest(entries) {
  const lines = [
    'export interface PixelIconManifestEntry {',
    '  id: string;',
    '  name: string;',
    '  tags: readonly string[];',
    '}',
    '',
    'export const iconManifest: readonly PixelIconManifestEntry[] = ['
  ];

  for (const entry of entries) {
    const tags = entry.tags.map((tag) => `'${String(tag).replace(/'/g, "\\'")}'`).join(', ');
    lines.push(`  { id: '${entry.id}', name: '${entry.name}', tags: [${tags}] },`);
  }

  lines.push('];', '');
  return lines.join('\n');
}

function serializePixelMap(entries) {
  const lines = [
    'export type PixelCell = readonly [number, number];',
    '',
    'export const lucidePixelMap: Readonly<Record<string, readonly PixelCell[]>> = Object.freeze({'
  ];

  for (const entry of entries) {
    const serializedCells = entry.pixelCells.map((cell) => `[${cell[0]}, ${cell[1]}]`).join(', ');
    lines.push(`  '${entry.id}': [${serializedCells}],`);
  }

  lines.push('});', '');
  return lines.join('\n');
}

async function ensureDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeJsonFile(filePath, payload) {
  await ensureDirectory(filePath);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function syncCanonicalSvgFiles(canonicalIds, dryRun) {
  const canonicalSet = new Set(canonicalIds);
  const entries = await fs.readdir(packageDir, { withFileTypes: true });
  const removed = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.svg')) {
      continue;
    }

    const id = entry.name.replace(/\.svg$/i, '');

    if (canonicalSet.has(id)) {
      continue;
    }

    removed.push(entry.name);

    if (!dryRun) {
      await fs.rm(path.join(packageDir, entry.name));
    }
  }

  removed.sort((a, b) => a.localeCompare(b));
  return removed;
}

async function convertIcon(id, canonicalTagMap, dryRun) {
  const sourcePath = path.join(sourceDir, `${id}.svg`);
  const outputPath = path.join(packageDir, `${id}.svg`);
  const sourceSvg = await fs.readFile(sourcePath, 'utf8');
  const baseGrid = buildPixelGrid(sourceSvg);
  const bridgedGrid = bridgeGaps(baseGrid);
  const cleanedGrid = removeIsolatedPixels(bridgedGrid);
  const rects = gridToRects(cleanedGrid);
  let pixelCells = gridToPixelCells(cleanedGrid);
  let wroteSvg = false;

  if (NO_OVERWRITE.has(id)) {
    try {
      const canonicalSvg = await fs.readFile(outputPath, 'utf8');
      const canonicalCells = extractCellsFromPixelSvg(canonicalSvg);

      if (canonicalCells.length > 0) {
        pixelCells = canonicalCells;
      }
    } catch {
      if (!dryRun) {
        await fs.writeFile(outputPath, renderPixelSvg(rects), 'utf8');
        wroteSvg = true;
      }
    }
  } else if (!dryRun) {
    await fs.writeFile(outputPath, renderPixelSvg(rects), 'utf8');
    wroteSvg = true;
  }

  return {
    id,
    name: titleCaseFromId(id),
    tags: buildTags(id, canonicalTagMap),
    pixelCells,
    wroteSvg
  };
}

function helpText() {
  return [
    'convert-lucide-to-pixel',
    '',
    'Options:',
    '  --dry-run              Process without writing svg/manifest/pixel-map outputs',
    '  --report [path]        Write conversion report JSON (default: reports/conversion-report.json)',
    '  --batch-start <n>      Start index in canonical id list (default: 0)',
    '  --batch-size <n>       Number of ids to process (default: all canonical ids)',
    '  --ids <a,b,c>          Explicit canonical ids to process (overrides batch slicing)',
    '  --help                 Print this help'
  ].join('\n');
}

export async function runConversion(rawOptions = {}) {
  const canonicalTagMap = await loadCanonicalTagMap();
  const canonicalIds = resolveCanonicalIconIds(canonicalTagMap);
  const options = {
    dryRun: Boolean(rawOptions.dryRun),
    report: Boolean(rawOptions.report),
    reportPath: rawOptions.reportPath ? path.resolve(rawOptions.reportPath) : undefined,
    batchStart: Math.max(0, parseIntegerArg(rawOptions.batchStart ?? 0, 0)),
    batchSize: Math.max(1, parseIntegerArg(rawOptions.batchSize ?? canonicalIds.length, canonicalIds.length)),
    ids: rawOptions.ids?.length ? [...rawOptions.ids] : undefined
  };

  const idsToProcess = resolveIdsToProcess(canonicalIds, options);
  const processingSet = new Set(idsToProcess);
  const shouldMergeExisting = idsToProcess.length < canonicalIds.length;
  const existingEntryMap = shouldMergeExisting ? await readExistingEntryMap(canonicalIds) : new Map();
  const nextEntryMap = new Map(existingEntryMap);

  const processed = [];
  const quarantined = [];
  const skippedMissingSource = [];

  for (const id of idsToProcess) {
    const sourcePath = path.join(sourceDir, `${id}.svg`);

    try {
      await fs.access(sourcePath);
    } catch {
      skippedMissingSource.push(id);
      continue;
    }

    const converted = await convertIcon(id, canonicalTagMap, options.dryRun);
    const quality = evaluateQuality(converted.pixelCells);

    const processedItem = {
      id,
      quality,
      wroteSvg: converted.wroteSvg,
      tags: converted.tags
    };

    processed.push(processedItem);

    if (quality.issues.length > 0) {
      quarantined.push({
        id,
        issues: quality.issues,
        metrics: quality.metrics
      });

      if (!existingEntryMap.has(id)) {
        nextEntryMap.delete(id);
      }

      continue;
    }

    nextEntryMap.set(id, {
      id,
      name: converted.name,
      tags: converted.tags,
      pixelCells: converted.pixelCells
    });
  }

  const manifestEntries = canonicalIds
    .filter((id) => nextEntryMap.has(id))
    .map((id) => nextEntryMap.get(id));

  let removedSvgFiles = [];

  if (!options.dryRun) {
    await ensureDirectory(manifestPath);
    await ensureDirectory(pixelMapPath);
    await fs.writeFile(manifestPath, serializeManifest(manifestEntries), 'utf8');
    await fs.writeFile(pixelMapPath, serializePixelMap(manifestEntries), 'utf8');

    const isFullCanonicalRun = idsToProcess.length === canonicalIds.length;

    if (isFullCanonicalRun) {
      removedSvgFiles = await syncCanonicalSvgFiles(canonicalIds, false);
    }
  } else if (idsToProcess.length === canonicalIds.length) {
    removedSvgFiles = await syncCanonicalSvgFiles(canonicalIds, true);
  }

  const missingCanonical = canonicalIds.filter((id) => !nextEntryMap.has(id));
  const report = {
    generatedAt: new Date().toISOString(),
    options: {
      dryRun: options.dryRun,
      batchStart: options.batchStart,
      batchSize: options.batchSize,
      ids: options.ids ?? null
    },
    summary: {
      canonicalCount: canonicalIds.length,
      processedCount: idsToProcess.length,
      acceptedCount: processed.length - quarantined.length,
      quarantinedCount: quarantined.length,
      skippedMissingSourceCount: skippedMissingSource.length,
      manifestCount: manifestEntries.length,
      missingCanonicalCount: missingCanonical.length,
      removedSvgFileCount: removedSvgFiles.length
    },
    skippedMissingSource,
    removedSvgFiles,
    missingCanonical,
    quarantined,
    processed: processed.map((item) => ({
      id: item.id,
      issues: item.quality.issues,
      metrics: item.quality.metrics,
      wroteSvg: item.wroteSvg
    }))
  };

  const reportPath = options.reportPath ?? defaultReportPath;
  const shouldWriteReport = options.report || quarantined.length > 0;

  if (shouldWriteReport) {
    await writeJsonFile(reportPath, report);
  }

  return report;
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

async function main() {
  const options = parseCliArgs();

  if (options.help) {
    console.log(helpText());
    return;
  }

  const report = await runConversion(options);

  console.log(
    `Processed ${report.summary.processedCount}/${report.summary.canonicalCount} canonical icons.`
  );
  console.log(
    `Accepted ${report.summary.acceptedCount}, quarantined ${report.summary.quarantinedCount}, manifest now ${report.summary.manifestCount}.`
  );

  if (options.report || report.summary.quarantinedCount > 0) {
    const outPath = options.reportPath ? path.resolve(options.reportPath) : defaultReportPath;
    console.log(`Report: ${outPath}`);
  }
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
