import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from 'svelte/compiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const distDir = path.join(packageDir, 'dist');
const distJsrDir = path.join(packageDir, 'dist-jsr');

async function listFilesRecursively(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function copyDistToJsrDist() {
  await rm(distJsrDir, { recursive: true, force: true });
  await mkdir(distJsrDir, { recursive: true });
  await cp(distDir, distJsrDir, { recursive: true });
}

async function compileSvelteFiles() {
  const allFiles = await listFilesRecursively(distJsrDir);
  const svelteFiles = allFiles.filter((filePath) => filePath.endsWith('.svelte'));

  for (const filePath of svelteFiles) {
    const source = await readFile(filePath, 'utf8');
    const relativeFile = path.relative(distJsrDir, filePath).replaceAll(path.sep, '/');
    const { js } = compile(source, {
      filename: relativeFile,
      generate: 'client',
      css: 'injected',
      dev: false
    });

    const jsPath = filePath.replace(/\.svelte$/i, '.js');
    await writeFile(jsPath, js.code, 'utf8');
  }
}

async function createJsTypeShims() {
  const allFiles = await listFilesRecursively(distJsrDir);
  const declarationFiles = allFiles.filter(
    (filePath) => filePath.endsWith('.d.ts') && !filePath.endsWith('.js.d.ts')
  );
  const fileSet = new Set(allFiles);

  for (const declarationFile of declarationFiles) {
    let jsModulePath;
    let jsTypeFile;

    if (declarationFile.endsWith('.svelte.d.ts')) {
      jsModulePath = declarationFile.replace(/\.svelte\.d\.ts$/i, '.js');
      jsTypeFile = declarationFile.replace(/\.svelte\.d\.ts$/i, '.js.d.ts');
    } else {
      jsModulePath = declarationFile.replace(/\.d\.ts$/i, '.js');
      jsTypeFile = declarationFile.replace(/\.d\.ts$/i, '.js.d.ts');
    }

    if (!fileSet.has(jsModulePath)) {
      continue;
    }

    const source = await readFile(declarationFile, 'utf8');
    await writeFile(jsTypeFile, source, 'utf8');
  }
}

function replaceSvelteSpecifiers(source) {
  return source.replaceAll('.svelte', '.js');
}

async function rewriteRuntimeAndTypeSpecifiers() {
  const allFiles = await listFilesRecursively(distJsrDir);
  const rewriteTargets = allFiles.filter(
    (filePath) => filePath.endsWith('.js') || filePath.endsWith('.d.ts')
  );

  for (const filePath of rewriteTargets) {
    const source = await readFile(filePath, 'utf8');
    const next = replaceSvelteSpecifiers(source);

    if (next !== source) {
      await writeFile(filePath, next, 'utf8');
    }
  }
}

async function main() {
  await copyDistToJsrDist();
  await compileSvelteFiles();
  await createJsTypeShims();
  await rewriteRuntimeAndTypeSpecifiers();

  console.log('Built JSR artifact at dist-jsr/');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
