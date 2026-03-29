const SVG_TAG_TOKEN_PATTERN = /<\/?([A-Za-z][A-Za-z0-9:._-]*)(?:\s[^<>]*?)?\/?\s*>/g;
const SVG_ATTRIBUTE_PATTERN =
  /([A-Za-z_:][A-Za-z0-9:._-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>/]+))/g;
const CANVAS_SIZE = 24;

/**
 * @typedef {readonly [number, number]} PixelCell
 * @typedef {readonly [number, number, number, number]} PixelRectRun
 * @typedef {Record<string, string>} SvgAttributes
 */

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * @param {string} token
 * @returns {boolean}
 */
function isSelfClosingTag(token) {
  return /\/\s*>$/.test(token);
}

/**
 * @param {string} token
 * @returns {SvgAttributes}
 */
function parseAttributes(token) {
  const attrs = /** @type {SvgAttributes} */ ({});

  for (const match of token.matchAll(SVG_ATTRIBUTE_PATTERN)) {
    const key = match[1];
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    attrs[key] = value;
  }

  return attrs;
}

/**
 * @param {Set<string>} seen
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function addRectCells(seen, x, y, width, height) {
  const startX = Math.round(x);
  const startY = Math.round(y);
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));

  for (let gy = startY; gy < startY + safeHeight; gy += 1) {
    if (gy < 0 || gy >= CANVAS_SIZE) {
      continue;
    }

    for (let gx = startX; gx < startX + safeWidth; gx += 1) {
      if (gx < 0 || gx >= CANVAS_SIZE) {
        continue;
      }

      seen.add(`${gx},${gy}`);
    }
  }
}

/**
 * Extracts unique 24x24 pixel cells from SVG geometry.
 * Supports both legacy `<rect x y width height/>` and canonical `<use href="#px" .../>` runs.
 *
 * @param {string} svgContent
 * @returns {readonly PixelCell[]}
 */
export function extractPixelCellsFromSvg(svgContent) {
  if (typeof svgContent !== 'string' || svgContent.trim().length === 0) {
    return Object.freeze([]);
  }

  const seen = new Set();
  let defsDepth = 0;

  for (const match of svgContent.matchAll(SVG_TAG_TOKEN_PATTERN)) {
    const token = match[0] ?? '';
    const tagName = (match[1] ?? '').toLowerCase();
    const isClosing = token.startsWith('</');

    if (isClosing) {
      if (tagName === 'defs' && defsDepth > 0) {
        defsDepth -= 1;
      }

      continue;
    }

    const selfClosing = isSelfClosingTag(token);
    const inDefs = defsDepth > 0;

    if (!inDefs && (tagName === 'rect' || tagName === 'use')) {
      const attrs = parseAttributes(token);

      if (tagName === 'rect') {
        addRectCells(
          seen,
          parseNumber(attrs.x, 0),
          parseNumber(attrs.y, 0),
          parseNumber(attrs.width, 1),
          parseNumber(attrs.height, 1)
        );
      } else {
        const href = String(attrs.href ?? attrs['xlink:href'] ?? '').trim();

        if (href && href !== '#px') {
          // Only canonical pixel symbol uses are considered geometry cells.
        } else {
          addRectCells(
            seen,
            parseNumber(attrs.x, 0),
            parseNumber(attrs.y, 0),
            parseNumber(attrs.width, 1),
            parseNumber(attrs.height, 1)
          );
        }
      }
    }

    if (tagName === 'defs' && !selfClosing) {
      defsDepth += 1;
    }
  }

  const cells = [...seen]
    .map((cell) => {
      const [x, y] = cell
        .split(',')
        .map(/** @param {string} value */ (value) => Number.parseInt(value, 10));
      return /** @type {PixelCell} */ (Object.freeze([x, y]));
    })
    .sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));

  return Object.freeze(cells);
}

/**
 * Converts cells into row-wise run-length rectangles.
 *
 * @param {readonly PixelCell[]} cells
 * @returns {readonly PixelRectRun[]}
 */
export function buildRectRunsFromPixelCells(cells) {
  if (!Array.isArray(cells) || cells.length === 0) {
    return Object.freeze([]);
  }

  const rows = /** @type {Map<number, number[]>} */ (new Map());

  for (const cell of cells) {
    const x = Number(cell?.[0]);
    const y = Number(cell?.[1]);

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      continue;
    }

    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) {
      continue;
    }

    const row = rows.get(y);

    if (row) {
      row.push(x);
    } else {
      rows.set(y, [x]);
    }
  }

  const runs = /** @type {PixelRectRun[]} */ ([]);
  const sortedRows = [...rows.keys()].sort((a, b) => a - b);

  for (const y of sortedRows) {
    const xs = [...new Set(rows.get(y) ?? [])].sort((a, b) => a - b);

    if (xs.length === 0) {
      continue;
    }

    let startX = xs[0];
    let previousX = xs[0];

    for (let index = 1; index < xs.length; index += 1) {
      const currentX = xs[index];

      if (currentX === previousX + 1) {
        previousX = currentX;
        continue;
      }

      runs.push(/** @type {PixelRectRun} */ (Object.freeze([startX, y, previousX - startX + 1, 1])));
      startX = currentX;
      previousX = currentX;
    }

    runs.push(/** @type {PixelRectRun} */ (Object.freeze([startX, y, previousX - startX + 1, 1])));
  }

  return Object.freeze(runs);
}

/**
 * Convenience helper for extracting run-length rectangles directly from SVG.
 *
 * @param {string} svgContent
 * @returns {readonly PixelRectRun[]}
 */
export function extractPixelRectRunsFromSvg(svgContent) {
  return buildRectRunsFromPixelCells(extractPixelCellsFromSvg(svgContent));
}
