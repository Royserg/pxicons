import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const SOURCE_EXPORT_PATTERN = /^\.\/src\/.+\.(?:[cm]?ts|tsx)$/;
const SOURCE_FILE_PATTERN = /\.(?:[cm]?ts|tsx)$/;
const RELATIVE_JS_SPECIFIER_PATTERN =
  /(?:\bfrom\s+|\bimport\s+|\bimport\s*\(\s*)['"](\.{1,2}\/[^'"]+\.js)['"]/g;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collectExportTargets(value, targets = []) {
  if (typeof value === 'string') {
    targets.push(value);
    return targets;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectExportTargets(item, targets);
    }

    return targets;
  }

  if (isPlainObject(value)) {
    for (const nestedValue of Object.values(value)) {
      collectExportTargets(nestedValue, targets);
    }
  }

  return targets;
}

function resolveWorkspaceCandidates(baseDir, nested = false) {
  return fs
    .readdir(baseDir, { withFileTypes: true })
    .then((entries) => {
      const directories = entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => path.join(baseDir, entry.name));

      if (!nested) {
        return directories;
      }

      return Promise.all(
        directories.map(async (directory) => {
          const nestedDirectories = await resolveWorkspaceCandidates(directory, false);
          return [directory, ...nestedDirectories];
        })
      ).then((lists) => lists.flat());
    })
    .catch(() => []);
}

async function getWorkspacePackageJsonPaths() {
  const packagePaths = new Set();
  const appsDir = path.join(workspaceRoot, 'apps');
  const packagesDir = path.join(workspaceRoot, 'packages');
  const toolsDir = path.join(workspaceRoot, 'tools');

  const [appCandidates, packageCandidates, toolCandidates] = await Promise.all([
    resolveWorkspaceCandidates(appsDir, false),
    resolveWorkspaceCandidates(packagesDir, true),
    resolveWorkspaceCandidates(toolsDir, false)
  ]);

  for (const candidate of [...appCandidates, ...packageCandidates, ...toolCandidates]) {
    const packageJsonPath = path.join(candidate, 'package.json');

    try {
      await fs.access(packageJsonPath);
      packagePaths.add(packageJsonPath);
    } catch {}
  }

  return [...packagePaths];
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function collectSourceFiles(directoryPath, output = []) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await collectSourceFiles(fullPath, output);
      continue;
    }

    if (SOURCE_FILE_PATTERN.test(entry.name)) {
      output.push(fullPath);
    }
  }

  return output;
}

function findLineNumber(content, index) {
  let line = 1;

  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content[cursor] === '\n') {
      line += 1;
    }
  }

  return line;
}

function findRelativeJsSpecifiers(content) {
  const diagnostics = [];
  const matches = content.matchAll(RELATIVE_JS_SPECIFIER_PATTERN);

  for (const match of matches) {
    const [fullMatch, specifier] = match;
    const index = match.index ?? content.indexOf(fullMatch);

    diagnostics.push({
      specifier,
      line: findLineNumber(content, index)
    });
  }

  return diagnostics;
}

async function main() {
  const packageJsonPaths = await getWorkspacePackageJsonPaths();
  const sourceExportedPackages = [];

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = await readJson(packageJsonPath);

    if (!packageJson.private) {
      continue;
    }

    const exportTargets = collectExportTargets(packageJson.exports);
    const hasSourceExportEntry = exportTargets.some((target) => SOURCE_EXPORT_PATTERN.test(target));

    if (!hasSourceExportEntry) {
      continue;
    }

    sourceExportedPackages.push({
      name: packageJson.name ?? path.dirname(packageJsonPath),
      dirPath: path.dirname(packageJsonPath)
    });
  }

  const violations = [];

  for (const pkg of sourceExportedPackages) {
    const srcPath = path.join(pkg.dirPath, 'src');

    try {
      await fs.access(srcPath);
    } catch {
      continue;
    }

    const sourceFiles = await collectSourceFiles(srcPath);

    for (const sourceFile of sourceFiles) {
      const content = await fs.readFile(sourceFile, 'utf8');
      const fileDiagnostics = findRelativeJsSpecifiers(content);

      for (const diagnostic of fileDiagnostics) {
        violations.push({
          packageName: pkg.name,
          filePath: sourceFile,
          ...diagnostic
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log('Source export verifier passed: no relative .js specifiers found.');
    return;
  }

  console.error('Source export verifier failed: found relative .js specifiers in source-exported packages.');

  for (const violation of violations) {
    const relativePath = path.relative(workspaceRoot, violation.filePath);
    console.error(
      `- ${violation.packageName}: ${relativePath}:${violation.line} -> ${violation.specifier}`
    );
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
