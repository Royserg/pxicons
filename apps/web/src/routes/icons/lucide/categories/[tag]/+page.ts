import { error } from '@sveltejs/kit';
import {
	getCategoriesForPack,
	getCategoryByPackAndSlug,
	getIconsForCategory
} from '$lib/icon-catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const category = getCategoryByPackAndSlug('lucide', params.tag);

	if (!category) {
		throw error(404, 'Category not found.');
	}

	return {
		category,
		icons: getIconsForCategory('lucide', category.slug),
		topCategories: getCategoriesForPack('lucide').slice(0, 12)
	};
};
