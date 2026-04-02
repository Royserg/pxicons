<script lang="ts">
	import { getCanonicalUrl, joinKeywords, SITE_NAME, SOCIAL_IMAGE_PATH } from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pathname = $derived(`/guides/${data.guide.slug}`);
	const canonicalUrl = $derived(getCanonicalUrl(pathname));
	const title = $derived(`${data.guide.title} | pxicons`);
	const description = $derived(data.guide.description);
	const keywords = $derived([
		'pixelart lucide icons',
		'pixel art lucide icons',
		'pxicons guide',
		data.guide.slug.replace(/-/g, ' ')
	]);
	const keywordsContent = $derived(joinKeywords(keywords));
	const guideJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'TechArticle',
		headline: data.guide.title,
		description,
		url: canonicalUrl,
		author: {
			'@type': 'Organization',
			name: SITE_NAME
		}
	});
	const guideJsonLdScript = $derived(
		`<script type="application/ld+json">${JSON.stringify(guideJsonLd)}<\/script>`
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywordsContent} />
	<meta name="robots" content="index,follow,max-image-preview:large" />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="article" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={getCanonicalUrl(SOCIAL_IMAGE_PATH)} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={getCanonicalUrl(SOCIAL_IMAGE_PATH)} />
	{@html guideJsonLdScript}
</svelte:head>

<article class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-2 py-4">
	<header class="space-y-2">
		<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">guide</p>
		<h1 class="text-3xl font-semibold">{data.guide.title}</h1>
		<p class="text-sm text-muted-foreground">{data.guide.intro}</p>
	</header>

	<section class="space-y-5">
		{#each data.guide.sections as section (section.heading)}
			<div class="rounded-lg border border-[var(--line)] p-4">
				<h2 class="text-lg font-semibold">{section.heading}</h2>
				<p class="mt-2 text-sm text-muted-foreground">{section.body}</p>
				{#if section.code}
					<pre
						class="mt-3 overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.78rem]"><code
							>{section.code}</code
						></pre>
				{/if}
			</div>
		{/each}
	</section>

	<nav class="flex flex-wrap gap-3 text-sm">
		<a class="underline" href="/guides">All guides</a>
		<a class="underline" href="/packages">Package docs</a>
		<a class="underline" href="/icons/lucide">Lucide browser</a>
	</nav>
</article>
