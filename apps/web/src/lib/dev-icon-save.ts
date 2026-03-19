import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runFrameworkGenerateSync, type FrameworkSyncResult } from './framework-sync';

export interface SaveIconSvgSuccess {
	ok: true;
	iconId: string;
	path: string;
	savedAt: string;
	frameworkSync: FrameworkSyncResult;
}

export interface SaveIconSvgFailure {
	ok: false;
	status: number;
	error: string;
}

export type SaveIconSvgResult = SaveIconSvgSuccess | SaveIconSvgFailure;

export interface SaveIconSvgInput {
	allowWrite: boolean;
	iconId: string;
	svg: unknown;
	cwd?: string;
	syncFrameworks?: (repoRoot: string) => Promise<FrameworkSyncResult>;
}

const ICON_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LUCIDE_DIR_PARTS = ['packages', 'icons', 'lucide'] as const;

async function pathExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

export function isValidIconId(iconId: string): boolean {
	return ICON_ID_PATTERN.test(iconId);
}

export async function findRepoRoot(startCwd: string = process.cwd()): Promise<string | null> {
	let current = path.resolve(startCwd);

	for (let index = 0; index < 10; index += 1) {
		const lucideDir = path.join(current, ...LUCIDE_DIR_PARTS);

		if (await pathExists(lucideDir)) {
			return current;
		}

		const parent = path.dirname(current);

		if (parent === current) {
			break;
		}

		current = parent;
	}

	return null;
}

export async function resolveLucideIconSvgPath(
	iconId: string,
	cwd: string = process.cwd()
): Promise<string | null> {
	if (!isValidIconId(iconId)) {
		return null;
	}

	const repoRoot = await findRepoRoot(cwd);

	if (!repoRoot) {
		return null;
	}

	const lucideDir = path.resolve(repoRoot, ...LUCIDE_DIR_PARTS);
	const targetPath = path.resolve(lucideDir, `${iconId}.svg`);

	if (!targetPath.startsWith(`${lucideDir}${path.sep}`)) {
		return null;
	}

	if (!(await pathExists(targetPath))) {
		return null;
	}

	return targetPath;
}

export async function saveIconSvgFile(input: SaveIconSvgInput): Promise<SaveIconSvgResult> {
	if (!input.allowWrite) {
		return {
			ok: false,
			status: 404,
			error: 'Not found.'
		};
	}

	if (!isValidIconId(input.iconId)) {
		return {
			ok: false,
			status: 400,
			error: 'Invalid icon id.'
		};
	}

	if (typeof input.svg !== 'string' || input.svg.trim().length === 0) {
		return {
			ok: false,
			status: 400,
			error: 'SVG payload must be a non-empty string.'
		};
	}

	const targetPath = await resolveLucideIconSvgPath(input.iconId, input.cwd);

	if (!targetPath) {
		return {
			ok: false,
			status: 400,
			error: 'Icon file path is invalid or missing.'
		};
	}

	try {
		await writeFile(targetPath, input.svg, 'utf8');
	} catch {
		return {
			ok: false,
			status: 500,
			error: 'Failed to write icon SVG file.'
		};
	}

	const repoRoot = await findRepoRoot(input.cwd);
	const fallbackFrameworkSync: FrameworkSyncResult = {
		status: 'failed',
		command: 'vp run frameworks:generate',
		durationMs: 0,
		message: 'Repository root not found. Framework source sync skipped.'
	};

	const frameworkSync =
		repoRoot !== null
			? await (input.syncFrameworks ?? ((nextRepoRoot) => runFrameworkGenerateSync({ cwd: nextRepoRoot })))(
					repoRoot
				)
			: fallbackFrameworkSync;

	return {
		ok: true,
		iconId: input.iconId,
		path: targetPath,
		savedAt: new Date().toISOString(),
		frameworkSync
	};
}
