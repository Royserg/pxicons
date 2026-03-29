import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const sourceDir = path.resolve(packageDir, '../../shared/lucide-core/src');
const targetDir = path.join(packageDir, 'src/_core');

async function main() {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });

  console.log(`Synced Lucide shared core sources to ${path.relative(packageDir, targetDir)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
