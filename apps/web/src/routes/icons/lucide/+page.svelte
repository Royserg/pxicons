<script lang="ts">
	import IconExplorer from '$lib/components/icon-explorer.svelte';
	import {
		getCanonicalUrl,
		joinKeywords,
		SITE_NAME,
		SOCIAL_IMAGE_PATH,
		toJsonLdScript
	} from '$lib/site';

	const pathname = '/icons/lucide';
	const canonicalUrl = getCanonicalUrl(pathname);

	const title = 'Lucide Pixel Icons | pxicons';
	const description =
		'Search the Lucide pack in pxicons with the original fast browser, scrollable icon grid, and drawer-based icon details.';
	const keywords = [
		'pixelart lucide icons',
		'pixel art lucide icons',
		'pxicons lucide',
		'lucide pixel icons'
	] as const;

	const collectionJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: title,
		description,
		url: canonicalUrl,
		isPartOf: {
			'@type': 'CollectionPage',
			name: 'pxicons browser',
			url: getCanonicalUrl('/icons')
		}
	};
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={joinKeywords(keywords)} />
	<meta name="robots" content="index,follow,max-image-preview:large" />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={getCanonicalUrl(SOCIAL_IMAGE_PATH)} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={getCanonicalUrl(SOCIAL_IMAGE_PATH)} />

	{@html toJsonLdScript(collectionJsonLd)}
</svelte:head>

<div class="flex min-h-0 flex-1 overflow-hidden">
	<IconExplorer />
</div>
