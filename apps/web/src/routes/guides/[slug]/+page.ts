import { error } from '@sveltejs/kit';
import { getGuideContent } from '$lib/guide-content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const guide = getGuideContent(params.slug);

	if (!guide) {
		throw error(404, 'Guide not found.');
	}

	return { guide };
};
