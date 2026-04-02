<script lang="ts">
	import IconBrowser from '$lib/components/icon-browser.svelte';
	import {
		getCanonicalUrl,
		joinKeywords,
		SITE_NAME,
		SOCIAL_IMAGE_PATH,
		toJsonLdScript
	} from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const categoryPath = $derived(`/icons/lucide/categories/${data.category.slug}`);
	const canonicalUrl = $derived(getCanonicalUrl(categoryPath));
	const title = $derived(
		`${data.category.tag} Lucide Pixel Icons (${data.category.iconCount}) | pxicons`
	);
	const description = $derived(
		`Browse ${data.category.iconCount} Lucide pixel icons in the ${data.category.tag} category and open pack-scoped detail pages from pxicons.`
	);
	const keywords = $derived([
		'pixelart lucide icons',
		`${data.category.tag} icons`,
		'pxicons lucide'
	]);
	const keywordsContent = $derived(joinKeywords(keywords));
	const categoryJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: title,
		description,
		url: canonicalUrl,
		isPartOf: {
			'@type': 'CollectionPage',
			name: 'pxicons lucide categories',
			url: getCanonicalUrl('/icons/lucide/categories')
		}
	});

	const packLinks = [
		{
			label: 'Lucide',
			href: '/icons/lucide',
			isActive: true
		}
	] as const;

	const categoryLinks = $derived(
		data.topCategories.map((category) => ({
			label: category.tag,
			href: `/icons/lucide/categories/${category.slug}`,
			count: category.iconCount,
			isActive: category.slug === data.category.slug
		}))
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywordsContent} />
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

	{@html toJsonLdScript(categoryJsonLd)}
</svelte:head>

<IconBrowser
	eyebrow="lucide category"
	title={data.category.tag}
	description={`Focused ${data.category.tag} results inside the Lucide pack. Search within this slice or jump back to the full Lucide browser.`}
	searchPlaceholder={`Search ${data.category.tag} icons...`}
	icons={data.icons}
	iconHrefBase="/icons/lucide"
	{packLinks}
	{categoryLinks}
	activeCategoryLabel={data.category.tag}
	emptyMessage={`No ${data.category.tag} icons match this search.`}
/>
