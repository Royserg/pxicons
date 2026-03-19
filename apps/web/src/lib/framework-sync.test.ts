import { describe, expect, it } from 'vite-plus/test';
import { runFrameworkGenerateSync } from './framework-sync';

describe('runFrameworkGenerateSync', () => {
	it('returns ok status when command succeeds', async () => {
		const calls: Array<{ file: string; args: readonly string[]; cwd: string }> = [];
		const result = await runFrameworkGenerateSync({
			cwd: '/repo',
			runCommand: async (file, args, options) => {
				calls.push({ file, args, cwd: options.cwd });
				return { stdout: 'ok' };
			}
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]).toEqual({
			file: 'vp',
			args: ['run', 'frameworks:generate'],
			cwd: '/repo'
		});
		expect(result.status).toBe('ok');
		expect(result.command).toBe('vp run frameworks:generate');
		expect(result.durationMs).toBeGreaterThanOrEqual(0);
	});

	it('returns failed status with message when command fails', async () => {
		const result = await runFrameworkGenerateSync({
			cwd: '/repo',
			runCommand: async () => {
				const error = new Error('spawn failed') as Error & { stderr?: string };
				error.stderr = 'framework generation failed\nmore details';
				throw error;
			}
		});

		expect(result.status).toBe('failed');
		expect(result.command).toBe('vp run frameworks:generate');
		expect(result.durationMs).toBeGreaterThanOrEqual(0);
		expect(result.message).toBe('framework generation failed');
	});
});
