import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(packageDir, 'package.json');
const jsrConfigPath = path.join(packageDir, 'jsr.json');

const JSR_SCHEMA_URL = 'https://jsr.io/schema/config-file.v1.json';
const NON_RUNTIME_EXPORTS = new Set(['./package.json']);
const JSR_DIST_PREFIX = './dist-jsr/';

function resolveRuntimeTarget(exportValue) {
  if (typeof exportValue === 'string') {
    return exportValue;
  }

  if (!exportValue || typeof exportValue !== 'object') {
    return null;
  }

  const candidateKeys = ['default', 'svelte', 'import', 'require'];

  for (const key of candidateKeys) {
    const candidate = exportValue[key];
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  return null;
}

function normalizeJsrExports(packageExports) {
  if (!packageExports || typeof packageExports !== 'object') {
    return { '.': `${JSR_DIST_PREFIX}lucide/index.js` };
  }

  const jsrExports = {};
  const allowWildcard = process.env.PXICONS_JSR_ALLOW_WILDCARD === '1';

  for (const [subpath, exportValue] of Object.entries(packageExports)) {
    if (NON_RUNTIME_EXPORTS.has(subpath)) {
      continue;
    }

    if (!allowWildcard && subpath.includes('*')) {
      continue;
    }

    const runtimeTarget = resolveRuntimeTarget(exportValue);

    if (!runtimeTarget) {
      throw new Error(
        `Could not resolve a runtime export target for "${subpath}". ` +
          'Expected a string export or one of: default, svelte, import, require.'
      );
    }

    jsrExports[subpath] = runtimeTarget.replace('./dist/', JSR_DIST_PREFIX);
  }

  if (Object.keys(jsrExports).length === 0) {
    jsrExports['.'] = `${JSR_DIST_PREFIX}lucide/index.js`;
  }

  return jsrExports;
}

function sortObjectKeys(value) {
  if (Array.isArray(value) || !value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, sortObjectKeys(nestedValue)])
  );
}

async function syncJsrConfig() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const jsrExports = normalizeJsrExports(packageJson.exports);

  const jsrConfig = sortObjectKeys({
    $schema: JSR_SCHEMA_URL,
    name: packageJson.name,
    version: packageJson.version,
    license: packageJson.license,
    exports: jsrExports
  });

  const nextContents = `${JSON.stringify(jsrConfig, null, 2)}\n`;
  let previousContents = null;

  try {
    previousContents = await readFile(jsrConfigPath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (previousContents === nextContents) {
    console.log('jsr.json is already up to date.');
    return;
  }

  await writeFile(jsrConfigPath, nextContents, 'utf8');
  console.log('Updated jsr.json from package.json.');
}

await syncJsrConfig();
