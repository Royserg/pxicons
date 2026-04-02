<script lang="ts">
	import { guideDocs } from '$lib/guides';
	import { getCanonicalUrl, joinKeywords, SITE_NAME, SOCIAL_IMAGE_PATH } from '$lib/site';

	const pathname = '/guides';
	const canonicalUrl = getCanonicalUrl(pathname);
	const title = 'pxicons Guides | Pixelart Lucide Icons';
	const description =
		'Short technical guides for using pixelart Lucide icons with Svelte, React, and vanilla JavaScript.';
	const keywords = [
		'pixelart lucide icons',
		'svelte icon guide',
		'react icon guide',
		'vanilla icon guide'
	] as const;
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
</svelte:head>

<article class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-2 py-4">
	<header class="space-y-2">
		<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">guides</p>
		<h1 class="text-3xl font-semibold">pxicons Guides</h1>
		<p class="text-sm text-muted-foreground">
			SEO-focused docs for common icon implementation workflows.
		</p>
	</header>

	<section class="space-y-3">
		{#each guideDocs as guide (guide.slug)}
			<a
				href={`/guides/${guide.slug}`}
				class="block rounded-lg border border-[var(--line)] p-4 no-underline transition-colors hover:border-[var(--line-strong)]"
			>
				<h2 class="text-base font-semibold">{guide.title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{guide.description}</p>
			</a>
		{/each}
	</section>
</article>
