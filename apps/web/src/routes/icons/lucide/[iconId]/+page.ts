import { error } from '@sveltejs/kit';
import { getCategoryByPackAndTag, getIconByPackAndId, getRelatedIcons } from '$lib/icon-catalog';
import {
	buildReactSnippet,
	buildSvelteSnippet,
	buildVanillaSnippet,
	toComponentName
} from '$lib/usage-snippets';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const icon = getIconByPackAndId('lucide', params.iconId);

	if (!icon) {
		throw error(404, 'Icon not found.');
	}

	const componentName = toComponentName(icon.id);
	const tagLinks = icon.tags.map((tag) => {
		const category = getCategoryByPackAndTag('lucide', tag);

		return {
			tag,
			href: category ? `/icons/lucide/categories/${category.slug}` : '/icons/lucide/categories'
		};
	});

	return {
		icon,
		relatedIcons: getRelatedIcons(icon, 12),
		tagLinks,
		componentName,
		svelteSnippet: buildSvelteSnippet(componentName),
		reactSnippet: buildReactSnippet(componentName),
		vanillaSnippet: buildVanillaSnippet(icon.id)
	};
};
