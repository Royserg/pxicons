import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { svgPathProperties } from 'svg-path-properties';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const sourceDir = path.join(packageDir, 'node_modules/lucide-static/icons');

const ICON_IDS = [
  'settings',
  'search',
  'home',
  'user',
  'users',
  'bell',
  'heart',
  'star',
  'bookmark',
  'message-circle',
  'mail',
  'phone',
  'camera',
  'image',
  'play',
  'pause',
  'stop-circle',
  'skip-forward',
  'skip-back',
  'volume-2',
  'volume-x',
  'mic',
  'mic-off',
  'lock',
  'unlock',
  'shield',
  'key',
  'trash-2',
  'pencil',
  'plus',
  'minus',
  'x',
  'check',
  'chevron-right',
  'chevron-left',
  'chevron-up',
  'chevron-down',
  'arrow-right',
  'arrow-left',
  'arrow-up',
  'arrow-down',
  'download',
  'upload',
  'share-2',
  'link',
  'copy',
  'external-link',
  'menu',
  'grid-3x3',
  'list',
  'calendar',
  'clock-3',
  'map-pin',
  'globe',
  'wifi',
  'bluetooth',
  'battery',
  'sun',
  'moon',
  'cloud',
  'cloud-rain',
  'folder',
  'file',
  'terminal',
  'code',
  'github'
];

const CUSTOM_TAGS = {
  settings: ['gear', 'preferences', 'config', 'tools'],
  search: ['magnifier', 'find', 'lookup'],
  home: ['house', 'dashboard'],
  user: ['profile', 'account', 'person'],
  users: ['team', 'group', 'accounts'],
  bell: ['notification', 'alert', 'ring'],
  heart: ['favorite', 'like', 'love'],
  star: ['favorite', 'bookmark', 'rating'],
  bookmark: ['save', 'favorite'],
  'message-circle': ['chat', 'comment', 'message'],
  mail: ['email', 'inbox', 'letter'],
  phone: ['call', 'contact', 'dial'],
  camera: ['photo', 'image', 'capture'],
  image: ['photo', 'picture', 'media'],
  play: ['start', 'media', 'video'],
  pause: ['media', 'hold'],
  'stop-circle': ['media', 'stop'],
  'skip-forward': ['next', 'media'],
  'skip-back': ['previous', 'media'],
  'volume-2': ['audio', 'sound', 'speaker'],
  'volume-x': ['mute', 'audio', 'sound'],
  mic: ['audio', 'record', 'microphone'],
  'mic-off': ['mute', 'microphone'],
  lock: ['secure', 'privacy', 'password'],
  unlock: ['open', 'secure', 'privacy'],
  shield: ['security', 'protection', 'safe'],
  key: ['access', 'security'],
  'trash-2': ['delete', 'remove', 'bin'],
  pencil: ['edit', 'write', 'draw'],
  plus: ['add', 'new', 'create'],
  minus: ['remove', 'subtract'],
  x: ['close', 'dismiss', 'cancel'],
  check: ['confirm', 'done', 'success'],
  'chevron-right': ['next', 'forward'],
  'chevron-left': ['previous', 'back'],
  'chevron-up': ['expand', 'up'],
  'chevron-down': ['collapse', 'down'],
  'arrow-right': ['next', 'forward', 'direction'],
  'arrow-left': ['back', 'previous', 'direction'],
  'arrow-up': ['direction', 'top'],
  'arrow-down': ['direction', 'bottom'],
  download: ['save', 'import'],
  upload: ['send', 'export'],
  'share-2': ['forward', 'external'],
  link: ['url', 'chain', 'connect'],
  copy: ['duplicate', 'clone'],
  'external-link': ['open', 'outbound', 'url'],
  menu: ['navigation', 'hamburger'],
  'grid-3x3': ['layout', 'apps', 'tiles'],
  list: ['rows', 'items', 'menu'],
  calendar: ['date', 'schedule', 'event'],
  'clock-3': ['time', 'watch'],
  'map-pin': ['location', 'place'],
  globe: ['world', 'internet', 'web'],
  wifi: ['network', 'internet', 'signal'],
  bluetooth: ['wireless', 'connection'],
  battery: ['power', 'charge'],
  sun: ['light', 'day', 'brightness'],
  moon: ['night', 'dark', 'theme'],
  cloud: ['weather', 'storage'],
  'cloud-rain': ['weather', 'rain'],
  folder: ['directory', 'files'],
  file: ['document', 'paper'],
  terminal: ['shell', 'cli', 'console'],
  code: ['development', 'brackets'],
  github: ['git', 'repository', 'source-control']
};

const NO_OVERWRITE = new Set(['settings']);
const SHAPE_TAGS = new Set(['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect']);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true
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
    if (key.startsWith('@_')) {
      continue;
    }

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

function buildTags(id) {
  const words = id
    .split('-')
    .map((word) => word.trim())
    .filter(Boolean);

  const tags = new Set([id, ...words]);

  for (const tag of CUSTOM_TAGS[id] || []) {
    tags.add(tag);
  }

  return [...tags];
}

async function convertIcon(id) {
  const sourcePath = path.join(sourceDir, `${id}.svg`);
  const outputPath = path.join(packageDir, `${id}.svg`);
  const sourceSvg = await fs.readFile(sourcePath, 'utf8');
  const baseGrid = buildPixelGrid(sourceSvg);
  const bridgedGrid = bridgeGaps(baseGrid);
  const cleanedGrid = removeIsolatedPixels(bridgedGrid);
  const rects = gridToRects(cleanedGrid);
  let pixelCells = gridToPixelCells(cleanedGrid);

  if (NO_OVERWRITE.has(id)) {
    const canonicalSvg = await fs.readFile(outputPath, 'utf8');
    const canonicalCells = extractCellsFromPixelSvg(canonicalSvg);

    if (canonicalCells.length > 0) {
      pixelCells = canonicalCells;
    }
  } else {
    await fs.writeFile(outputPath, renderPixelSvg(rects), 'utf8');
  }

  return {
    id,
    name: titleCaseFromId(id),
    tags: buildTags(id),
    pixelCells
  };
}

async function writeManifest(manifest) {
  const filePath = path.join(packageDir, 'src/icon-manifest.ts');
  const lines = [
    'export interface PixelIconManifestEntry {',
    '  id: string;',
    '  name: string;',
    '  tags: readonly string[];',
    '}',
    '',
    'export const iconManifest: readonly PixelIconManifestEntry[] = ['
  ];

  for (const entry of manifest) {
    const tags = entry.tags.map((tag) => `'${tag.replace(/'/g, "\\'")}'`).join(', ');
    lines.push(
      `  { id: '${entry.id}', name: '${entry.name}', tags: [${tags}] },`
    );
  }

  lines.push('];', '');
  await fs.writeFile(filePath, lines.join('\n'), 'utf8');
}

async function writePixelMap(manifest) {
  const filePath = path.join(packageDir, 'src/pixel-map.ts');
  const lines = [
    'export type PixelCell = readonly [number, number];',
    '',
    'export const lucidePixelMap: Readonly<Record<string, readonly PixelCell[]>> = Object.freeze({'
  ];

  for (const entry of manifest) {
    const serializedCells = entry.pixelCells.map((cell) => `[${cell[0]}, ${cell[1]}]`).join(', ');
    lines.push(`  '${entry.id}': [${serializedCells}],`);
  }

  lines.push('});', '');
  await fs.writeFile(filePath, lines.join('\n'), 'utf8');
}

async function main() {
  const manifest = [];

  for (const id of ICON_IDS) {
    const sourcePath = path.join(sourceDir, `${id}.svg`);

    try {
      await fs.access(sourcePath);
    } catch {
      console.warn(`[skip] Missing source icon: ${id}`);
      continue;
    }

    const entry = await convertIcon(id);
    manifest.push(entry);
  }

  await writeManifest(manifest);
  await writePixelMap(manifest);

  console.log(`Converted ${manifest.length} Lucide icons to pixel SVG.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
