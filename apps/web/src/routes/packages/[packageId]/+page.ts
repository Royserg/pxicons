import { error } from '@sveltejs/kit';
import { getPackageDoc } from '$lib/package-docs';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const pkg = getPackageDoc(params.packageId);

	if (!pkg) {
		throw error(404, 'Package not found.');
	}

	return { pkg };
};
