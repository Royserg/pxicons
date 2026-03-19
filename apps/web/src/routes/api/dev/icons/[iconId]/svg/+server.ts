import { dev } from '$app/environment';
import { saveIconSvgFile } from '$lib/dev-icon-save';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function readSvgFromPayload(payload: unknown): unknown {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return undefined;
	}

	return (payload as { svg?: unknown }).svg;
}

export const PUT: RequestHandler = async ({ params, request }) => {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON.' }, { status: 400 });
	}

	const result = await saveIconSvgFile({
		allowWrite: dev,
		iconId: params.iconId ?? '',
		svg: readSvgFromPayload(payload),
		cwd: process.cwd()
	});

	if (!result.ok) {
		return json({ error: result.error }, { status: result.status });
	}

	return json(result);
};
