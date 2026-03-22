import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

type ExportValue =
  | string
  | {
      default?: string;
      svelte?: string;
      import?: string;
      require?: string;
      [key: string]: unknown;
    };

type PackageJson = {
  name: string;
  version: string;
  license: string;
  exports?: Record<string, ExportValue>;
};

type JsrConfig = {
  name: string;
  version: string;
  license: string;
  exports: Record<string, string>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');

const NON_RUNTIME_EXPORTS = new Set(['./package.json']);
const RUNTIME_EXPORT_KEYS = ['default', 'svelte', 'import', 'require'] as const;
const JSR_DIST_PREFIX = './dist-jsr/';

function readPackageJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(packageDir, relativePath), 'utf8')) as T;
}

function resolveRuntimeTarget(exportValue: ExportValue): string {
  if (typeof exportValue === 'string') {
    return exportValue;
  }

  for (const key of RUNTIME_EXPORT_KEYS) {
    const candidate = exportValue[key];
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  throw new Error(`Could not resolve runtime target from export value: ${JSON.stringify(exportValue)}`);
}

function normalizeExports(
  packageExports: Record<string, ExportValue> | undefined,
  disableWildcard: boolean
): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (!packageExports) {
    return normalized;
  }

  for (const [subpath, exportValue] of Object.entries(packageExports)) {
    if (NON_RUNTIME_EXPORTS.has(subpath)) {
      continue;
    }

    if (disableWildcard && subpath.includes('*')) {
      continue;
    }

    normalized[subpath] = resolveRuntimeTarget(exportValue).replace('./dist/', JSR_DIST_PREFIX);
  }

  return normalized;
}

describe('@pxicons/lucide-svelte release surface', () => {
  it('keeps jsr.json metadata synced with package.json', () => {
    const packageJson = readPackageJson<PackageJson>('package.json');
    const jsrConfig = readPackageJson<JsrConfig>('jsr.json');

    expect(jsrConfig.name).toBe(packageJson.name);
    expect(jsrConfig.version).toBe(packageJson.version);
    expect(jsrConfig.license).toBe(packageJson.license);
  });

  it('keeps jsr runtime exports synced with package exports', () => {
    const packageJson = readPackageJson<PackageJson>('package.json');
    const jsrConfig = readPackageJson<JsrConfig>('jsr.json');

    const fullExports = normalizeExports(packageJson.exports, false);
    const fallbackExports = normalizeExports(packageJson.exports, true);

    expect(jsrConfig.exports).not.toHaveProperty('./package.json');

    if (Object.prototype.hasOwnProperty.call(jsrConfig.exports, './icons/*')) {
      expect(jsrConfig.exports).toEqual(fullExports);
    } else {
      expect(jsrConfig.exports).toEqual(fallbackExports);
      expect(Object.keys(jsrConfig.exports).sort()).toEqual(['.', './icons']);
    }

    for (const exportTarget of Object.values(jsrConfig.exports)) {
      expect(exportTarget.startsWith(JSR_DIST_PREFIX)).toBe(true);
    }
  });
});
