import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
	saveIconSvgFile: vi.fn()
}));

vi.mock('$app/environment', () => ({
	dev: true
}));

vi.mock('$lib/dev-icon-save', () => ({
	saveIconSvgFile: mocks.saveIconSvgFile
}));

import { PUT } from '../routes/api/dev/icons/[iconId]/svg/+server';

describe('PUT /api/dev/icons/[iconId]/svg', () => {
	beforeEach(() => {
		mocks.saveIconSvgFile.mockReset();
	});

	it('calls save and returns success payload with framework sync metadata', async () => {
		mocks.saveIconSvgFile.mockResolvedValue({
			ok: true,
			iconId: 'settings',
			path: '/repo/packages/frameworks/lucide/settings.svg',
			savedAt: '2026-03-19T10:00:00.000Z',
			frameworkSync: {
				status: 'ok',
				command: 'vp run frameworks:generate',
				durationMs: 122
			}
		});

		const response = await PUT({
			params: { iconId: 'settings' },
			request: new Request('http://localhost/api/dev/icons/settings/svg', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ svg: '<svg/>' })
			})
		} as never);

		expect(mocks.saveIconSvgFile).toHaveBeenCalledTimes(1);
		expect(mocks.saveIconSvgFile).toHaveBeenCalledWith({
			allowWrite: true,
			iconId: 'settings',
			svg: '<svg/>',
			cwd: process.cwd()
		});
		expect(response.status).toBe(200);

		const payload = (await response.json()) as {
			ok: boolean;
			frameworkSync?: { status?: string };
		};
		expect(payload.ok).toBe(true);
		expect(payload.frameworkSync?.status).toBe('ok');
	});

	it('returns partial-success payload when framework sync fails', async () => {
		mocks.saveIconSvgFile.mockResolvedValue({
			ok: true,
			iconId: 'settings',
			path: '/repo/packages/frameworks/lucide/settings.svg',
			savedAt: '2026-03-19T10:00:00.000Z',
			frameworkSync: {
				status: 'failed',
				command: 'vp run frameworks:generate',
				durationMs: 118,
				message: 'generation failed'
			}
		});

		const response = await PUT({
			params: { iconId: 'settings' },
			request: new Request('http://localhost/api/dev/icons/settings/svg', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ svg: '<svg/>' })
			})
		} as never);

		expect(response.status).toBe(200);

		const payload = (await response.json()) as {
			ok: boolean;
			frameworkSync?: { status?: string; message?: string };
		};
		expect(payload.ok).toBe(true);
		expect(payload.frameworkSync?.status).toBe('failed');
		expect(payload.frameworkSync?.message).toBe('generation failed');
	});
});
