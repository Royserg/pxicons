<script lang="ts">
	import { getCategoriesForPack, getIconPack } from '$lib/icon-catalog';
	import {
		getCanonicalUrl,
		joinKeywords,
		SITE_NAME,
		SOCIAL_IMAGE_PATH,
		toJsonLdScript
	} from '$lib/site';

	const pathname = '/icons/lucide/categories';
	const canonicalUrl = getCanonicalUrl(pathname);
	const pack = getIconPack('lucide');
	const categories = getCategoriesForPack('lucide');

	const title = 'Lucide Icon Categories | pxicons';
	const description =
		'Browse Lucide icon categories in pxicons and jump into focused pixelart icon result pages.';
	const keywords = ['pixelart lucide icons', 'lucide icon categories', 'pixel icon tags'] as const;

	const collectionJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: title,
		description,
		url: canonicalUrl
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

<article class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-2 py-4">
	<header class="space-y-3">
		<p class="text-[0.7rem] tracking-[0.18em] text-muted-foreground uppercase">
			{pack?.name} categories
		</p>
		<h1 class="text-3xl font-semibold">Browse Lucide icon categories</h1>
		<p class="max-w-3xl text-sm text-muted-foreground">
			Open a focused result page for each Lucide tag cluster and keep searching from there.
		</p>
	</header>

	<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each categories as category (category.slug)}
			<a
				href={`/icons/lucide/categories/${category.slug}`}
				class="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 no-underline transition-colors hover:border-[var(--line-strong)]"
			>
				<p class="text-sm font-semibold">{category.tag}</p>
				<p class="mt-2 text-xs text-muted-foreground">{category.iconCount} icons</p>
			</a>
		{/each}
	</section>
</article>
