import {
  hasA11yProp,
  normalizeIconName,
  resolveIconRenderModel,
  type IconRenderMode,
  type LucideIconDefinition,
  type PixelShape
} from '@pxicons/lucide/_core';
import { iconsById as defaultIconsById } from './generated/icons/registry.js';

export type { LucideIconDefinition } from '@pxicons/lucide/_core';

export interface IconRenderOptions {
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  shape?: PixelShape | string;
  renderMode?: IconRenderMode | string;
  title?: string;
  attrs?: Record<string, unknown>;
  class?: string;
}

export interface ReplaceElementOptions extends IconRenderOptions {
  nameAttr?: string;
}

export interface CreateIconsOptions extends Omit<IconRenderOptions, 'title' | 'class'> {
  icons?: Readonly<Record<string, LucideIconDefinition>>;
  nameAttr?: string;
  root?: ParentNode;
  warn?: (message: string) => void;
}

export interface CreateIconsResult {
  total: number;
  replaced: number;
  skipped: number;
}

const DEFAULT_ATTRIBUTES = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  'shape-rendering': 'crispEdges'
} as const;

function toAttributeRecord(value: Record<string, unknown> | undefined): Record<string, string> {
  if (!value) {
    return {};
  }

  const output: Record<string, string> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null || raw === false) {
      continue;
    }

    output[key] = raw === true ? 'true' : String(raw);
  }

  return output;
}

function joinClasses(...values: Array<string | undefined>): string {
  const classSet = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const token of value.split(/\s+/)) {
      const trimmed = token.trim();

      if (trimmed.length > 0) {
        classSet.add(trimmed);
      }
    }
  }

  return [...classSet].join(' ');
}

function iconClassNames(iconId: string): string {
  return `pxicons-icon lucide-icon lucide lucide-${iconId} pxicons-${iconId}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;

  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return String(rounded)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1');
}

function buildRawPrimitiveMarkup(
  icon: LucideIconDefinition,
  shape: PixelShape,
  pixelSize: number,
  pixelInset: number,
  roundedCornerRadius: number
): string {
  if (shape === 'circle') {
    return icon.iconPixels
      .map(([x, y]) => {
        const cx = x + pixelInset + pixelSize / 2;
        const cy = y + pixelInset + pixelSize / 2;
        return `<circle cx="${formatNumber(cx)}" cy="${formatNumber(cy)}" r="${formatNumber(pixelSize / 2)}" />`;
      })
      .join('');
  }

  if (shape === 'rounded') {
    return icon.iconPixels
      .map(([x, y]) => {
        const px = x + pixelInset;
        const py = y + pixelInset;

        return `<rect x="${formatNumber(px)}" y="${formatNumber(py)}" width="${formatNumber(pixelSize)}" height="${formatNumber(pixelSize)}" rx="${formatNumber(roundedCornerRadius)}" ry="${formatNumber(roundedCornerRadius)}" />`;
      })
      .join('');
  }

  return icon.iconPixels
    .map(([x, y]) => {
      const px = x + pixelInset;
      const py = y + pixelInset;

      return `<rect x="${formatNumber(px)}" y="${formatNumber(py)}" width="${formatNumber(pixelSize)}" height="${formatNumber(pixelSize)}" />`;
    })
    .join('');
}

function resolveSvgAttributes(icon: LucideIconDefinition, options: IconRenderOptions): Record<string, string> {
  const attrs: Record<string, string> = {
    ...DEFAULT_ATTRIBUTES,
    ...toAttributeRecord(options.attrs)
  };

  attrs.viewBox = icon.viewBox || attrs.viewBox;

  if (options.size !== undefined) {
    attrs.width = String(options.size);
    attrs.height = String(options.size);
  }

  attrs.class = joinClasses(iconClassNames(icon.id), attrs.class, options.class);

  const a11yProps: Record<string, unknown> = {
    ...attrs
  };

  if (options.title) {
    delete attrs['aria-hidden'];
  } else if (!hasA11yProp(a11yProps)) {
    attrs['aria-hidden'] = 'true';
  }

  return attrs;
}

function attrsToString(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(' ');
}

export function iconToSvg(icon: LucideIconDefinition, options: IconRenderOptions = {}): string {
  const svgAttrs = resolveSvgAttributes(icon, options);
  const renderModel = resolveIconRenderModel({
    iconPixels: icon.iconPixels,
    iconRects: icon.iconRects,
    size: options.size,
    strokeWidth: options.strokeWidth,
    absoluteStrokeWidth: options.absoluteStrokeWidth,
    shape: options.shape,
    renderMode: options.renderMode
  });
  const color = options.color ?? 'currentColor';
  const titleMarkup = options.title ? `<title>${escapeHtml(options.title)}</title>` : '';

  const glyphMarkup = renderModel.shouldRenderOptimized
    ? `<path d="${renderModel.optimizedPathData ?? ''}" />`
    : buildRawPrimitiveMarkup(
        icon,
        renderModel.normalizedShape,
        renderModel.pixelSize,
        renderModel.pixelInset,
        renderModel.roundedCornerRadius
      );

  return `<svg ${attrsToString(svgAttrs)}>${titleMarkup}<g fill="${escapeHtml(color)}">${glyphMarkup}</g></svg>`;
}

function parseSvgElement(svgMarkup: string, ownerDocument: Document): SVGSVGElement {
  const template = ownerDocument.createElement('template');
  template.innerHTML = svgMarkup.trim();
  const node = template.content.firstElementChild;

  if (!node || node.tagName.toLowerCase() !== 'svg') {
    throw new Error('Could not parse generated icon SVG markup.');
  }

  return node as SVGSVGElement;
}

function parseDataPxValue(rawValue: string): { library: string; iconId: string } | null {
  const separator = rawValue.indexOf(':');

  if (separator <= 0) {
    return null;
  }

  const rawLibrary = rawValue.slice(0, separator).trim().toLowerCase();
  const rawIconId = rawValue.slice(separator + 1).trim();

  if (!rawLibrary || !rawIconId) {
    return null;
  }

  const iconId = normalizeIconName(rawIconId);

  if (!iconId) {
    return null;
  }

  return {
    library: rawLibrary,
    iconId
  };
}

function createLookupMap(icons: Readonly<Record<string, LucideIconDefinition>>): Record<string, LucideIconDefinition> {
  const byId: Record<string, LucideIconDefinition> = {};

  for (const icon of Object.values(icons)) {
    if (!icon?.id) {
      continue;
    }

    byId[normalizeIconName(icon.id)] = icon;
  }

  return byId;
}

function queryTargets(root: ParentNode, nameAttr: string): Element[] {
  if (!('querySelectorAll' in root) || typeof root.querySelectorAll !== 'function') {
    return [];
  }

  return [...root.querySelectorAll(`[${nameAttr}]`)];
}

export function replaceElement(
  element: Element,
  icon: LucideIconDefinition,
  options: ReplaceElementOptions = {}
): SVGSVGElement {
  const ownerDocument = element.ownerDocument;

  if (!ownerDocument) {
    throw new Error('Target element has no ownerDocument.');
  }

  const nameAttr = options.nameAttr ?? 'data-px';
  const inheritedAttrs: Record<string, string> = {};

  for (const { name, value } of [...element.attributes]) {
    if (name === nameAttr) {
      continue;
    }

    inheritedAttrs[name] = value;
  }

  const svgMarkup = iconToSvg(icon, {
    ...options,
    attrs: {
      ...toAttributeRecord(options.attrs),
      ...inheritedAttrs
    }
  });

  const svgElement = parseSvgElement(svgMarkup, ownerDocument);
  element.replaceWith(svgElement);

  return svgElement;
}

export function createIcons(options: CreateIconsOptions = {}): CreateIconsResult {
  const nameAttr = options.nameAttr ?? 'data-px';
  const root = options.root ?? document;
  const warn = options.warn ?? ((message: string) => console.warn(message));

  const lookupMap = options.icons
    ? createLookupMap(options.icons)
    : (defaultIconsById as Record<string, LucideIconDefinition>);

  const targets = queryTargets(root, nameAttr);
  let replaced = 0;
  let skipped = 0;

  for (const element of targets) {
    const rawValue = element.getAttribute(nameAttr);

    if (!rawValue) {
      skipped += 1;
      continue;
    }

    const parsed = parseDataPxValue(rawValue);

    if (!parsed) {
      warn(`Ignoring malformed ${nameAttr} value: ${rawValue}`);
      skipped += 1;
      continue;
    }

    if (parsed.library !== 'lucide') {
      warn(`Unsupported icon library in ${nameAttr}: ${parsed.library}`);
      skipped += 1;
      continue;
    }

    const icon = lookupMap[parsed.iconId];

    if (!icon) {
      warn(`Unknown icon id for ${nameAttr}: ${parsed.iconId}`);
      skipped += 1;
      continue;
    }

    replaceElement(element, icon, {
      ...options,
      nameAttr
    });

    replaced += 1;
  }

  return {
    total: targets.length,
    replaced,
    skipped
  };
}
