import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import {
	findRepoRoot,
	isValidIconId,
	resolveLucideIconSvgPath,
	saveIconSvgFile
} from './dev-icon-save';
import type { FrameworkSyncResult } from './framework-sync';

async function createTempRepo(): Promise<{
	repoRoot: string;
	lucideDir: string;
	cleanup: () => Promise<void>;
}> {
	const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'pxicons-save-'));
	const lucideDir = path.join(repoRoot, 'packages/icons/lucide');
	const appDir = path.join(repoRoot, 'apps/web');

	await mkdir(lucideDir, { recursive: true });
	await mkdir(appDir, { recursive: true });
	await writeFile(path.join(lucideDir, 'settings.svg'), '<svg/>\n', 'utf8');

	return {
		repoRoot,
		lucideDir,
		cleanup: async () => {
			await rm(repoRoot, { recursive: true, force: true });
		}
	};
}

describe('dev-icon-save', () => {
	const okSyncResult: FrameworkSyncResult = {
		status: 'ok',
		command: 'vp run frameworks:generate',
		durationMs: 11
	};

	it('validates icon ids with a strict slug format', () => {
		expect(isValidIconId('settings')).toBe(true);
		expect(isValidIconId('volume-1')).toBe(true);
		expect(isValidIconId('../settings')).toBe(false);
		expect(isValidIconId('Settings')).toBe(false);
	});

	it('resolves icon file path from nested cwd', async () => {
		const repo = await createTempRepo();

		try {
			const nestedCwd = path.join(repo.repoRoot, 'apps/web');
			const foundRoot = await findRepoRoot(nestedCwd);
			const filePath = await resolveLucideIconSvgPath('settings', nestedCwd);

			expect(foundRoot).toBe(repo.repoRoot);
			expect(filePath).toBe(path.join(repo.lucideDir, 'settings.svg'));
		} finally {
			await repo.cleanup();
		}
	});

	it('rejects save requests when dev write is disabled', async () => {
		const result = await saveIconSvgFile({
			allowWrite: false,
			iconId: 'settings',
			svg: '<svg/>'
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(404);
		}
	});

	it('rejects invalid icon id or missing path', async () => {
		const repo = await createTempRepo();

		try {
			const invalidId = await saveIconSvgFile({
				allowWrite: true,
				iconId: '../settings',
				svg: '<svg/>',
				cwd: repo.repoRoot
			});
			expect(invalidId.ok).toBe(false);

			const missingFile = await saveIconSvgFile({
				allowWrite: true,
				iconId: 'missing-icon',
				svg: '<svg/>',
				cwd: repo.repoRoot
			});
			expect(missingFile.ok).toBe(false);
			if (!missingFile.ok) {
				expect(missingFile.status).toBe(400);
			}
		} finally {
			await repo.cleanup();
		}
	});

	it('writes SVG content to the connected icon file', async () => {
		const repo = await createTempRepo();
		const nextSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n  <rect x="1" y="1" width="1" height="1"/>\n</svg>\n`;
		const syncCalls: string[] = [];

		try {
			const result = await saveIconSvgFile({
				allowWrite: true,
				iconId: 'settings',
				svg: nextSvg,
				cwd: path.join(repo.repoRoot, 'apps/web'),
				syncFrameworks: async (repoRoot) => {
					syncCalls.push(repoRoot);
					return okSyncResult;
				}
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.path).toBe(path.join(repo.lucideDir, 'settings.svg'));
				expect(result.frameworkSync).toEqual(okSyncResult);
			}
			expect(syncCalls).toEqual([repo.repoRoot]);

			const fileContent = await readFile(path.join(repo.lucideDir, 'settings.svg'), 'utf8');
			expect(fileContent).toBe(nextSvg);
		} finally {
			await repo.cleanup();
		}
	});

	it('returns partial success when framework sync fails', async () => {
		const repo = await createTempRepo();
		const nextSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>\n';

		try {
			const result = await saveIconSvgFile({
				allowWrite: true,
				iconId: 'settings',
				svg: nextSvg,
				cwd: path.join(repo.repoRoot, 'apps/web'),
				syncFrameworks: async () => ({
					status: 'failed',
					command: 'vp run frameworks:generate',
					durationMs: 4,
					message: 'generation failed'
				})
			});

			expect(result.ok).toBe(true);
			if (!result.ok) {
				return;
			}

			expect(result.frameworkSync.status).toBe('failed');
			expect(result.frameworkSync.message).toBe('generation failed');

			const fileContent = await readFile(path.join(repo.lucideDir, 'settings.svg'), 'utf8');
			expect(fileContent).toBe(nextSvg);
		} finally {
			await repo.cleanup();
		}
	});
});
