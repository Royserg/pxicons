import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export type FrameworkSyncStatus = 'ok' | 'failed';

export interface FrameworkSyncResult {
	status: FrameworkSyncStatus;
	command: string;
	durationMs: number;
	message?: string;
}

export interface FrameworkSyncRunnerOptions {
	cwd: string;
	runCommand?: FrameworkCommandRunner;
}

export interface FrameworkCommandRunner {
	(
		file: string,
		args: readonly string[],
		options: { cwd: string }
	): Promise<{ stdout?: string; stderr?: string }>;
}

const execFileAsync = promisify(execFile);
const FRAMEWORKS_GENERATE_ARGS = ['run', 'frameworks:generate'] as const;
const FRAMEWORKS_GENERATE_COMMAND = `vp ${FRAMEWORKS_GENERATE_ARGS.join(' ')}`;

function trimMessage(value: unknown): string {
	if (typeof value !== 'string') {
		return '';
	}

	return value.trim();
}

function toSyncFailureMessage(error: unknown): string {
	if (!(error instanceof Error)) {
		return 'Unknown framework sync failure.';
	}

	const errorWithStreams = error as Error & {
		stdout?: string | Buffer;
		stderr?: string | Buffer;
	};
	const stderrText = trimMessage(errorWithStreams.stderr?.toString());

	if (stderrText) {
		return stderrText.split('\n')[0] ?? stderrText;
	}

	const stdoutText = trimMessage(errorWithStreams.stdout?.toString());

	if (stdoutText) {
		return stdoutText.split('\n')[0] ?? stdoutText;
	}

	return trimMessage(error.message) || 'Framework sync command failed.';
}

async function defaultCommandRunner(
	file: string,
	args: readonly string[],
	options: { cwd: string }
): Promise<{ stdout?: string; stderr?: string }> {
	return execFileAsync(file, [...args], {
		cwd: options.cwd,
		maxBuffer: 16 * 1024 * 1024,
		windowsHide: true
	});
}

export async function runFrameworkGenerateSync(
	options: FrameworkSyncRunnerOptions
): Promise<FrameworkSyncResult> {
	const start = Date.now();
	const runCommand = options.runCommand ?? defaultCommandRunner;

	try {
		await runCommand('vp', FRAMEWORKS_GENERATE_ARGS, { cwd: options.cwd });
		return {
			status: 'ok',
			command: FRAMEWORKS_GENERATE_COMMAND,
			durationMs: Date.now() - start
		};
	} catch (error) {
		return {
			status: 'failed',
			command: FRAMEWORKS_GENERATE_COMMAND,
			durationMs: Date.now() - start,
			message: toSyncFailureMessage(error)
		};
	}
}
