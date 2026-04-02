<script lang="ts">
	import {
		getCanonicalUrl,
		joinKeywords,
		SITE_DESCRIPTION,
		SITE_NAME,
		SOCIAL_IMAGE_PATH,
		toJsonLdScript
	} from '$lib/site';
	import { getFeaturedIcons, getTopCategories, iconCount } from '$lib/icon-catalog';
	import { packageDocs } from '$lib/package-docs';

	const pathname = '/pixelart-lucide-icons';
	const canonicalUrl = getCanonicalUrl(pathname);
	const title = 'Pixelart Lucide Icons | Complete Catalog and Install Guide';
	const description =
		'Discover pixelart Lucide icons from pxicons, compare package options, and ship pixel-perfect SVG icons in Svelte, React, and vanilla JavaScript.';
	const keywords = [
		'pixelart lucide icons',
		'pixel art lucide icons',
		'pxicons',
		'lucide icons',
		'svelte icons',
		'react icons'
	] as const;

	const featuredIcons = getFeaturedIcons(18);
	const topCategories = getTopCategories(18, 12, 'lucide');
	const websiteJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: title,
		description,
		url: canonicalUrl,
		isPartOf: {
			'@type': 'WebSite',
			name: SITE_NAME,
			url: getCanonicalUrl('/')
		},
		about: ['pixelart lucide icons', 'svg icon library', 'frontend icon packages']
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
	{@html toJsonLdScript(websiteJsonLd)}
</svelte:head>

<article class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 py-4">
	<header class="space-y-3">
		<p class="text-xs tracking-[0.18em] text-muted-foreground uppercase">pxicons guide</p>
		<h1 class="text-3xl leading-tight font-semibold md:text-4xl">
			Pixelart Lucide Icons for Modern Frontends
		</h1>
		<p class="max-w-3xl text-sm text-muted-foreground md:text-base">
			pxicons ships <strong>{iconCount.toLocaleString()}</strong> pixelart Lucide icons with package support
			for Svelte, React, and vanilla JavaScript. This page helps teams evaluate package choices, discover
			icon categories, and jump to implementation docs.
		</p>
	</header>

	<section class="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
		<h2 class="text-xl font-semibold">Pick the Right Package</h2>
		<div class="grid gap-3 md:grid-cols-3">
			{#each packageDocs as pkg (pkg.id)}
				<a
					href={`/packages/${pkg.id}`}
					class="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-background p-3 no-underline transition-colors hover:border-[var(--line-strong)]"
				>
					<h3 class="text-sm font-semibold">{pkg.packageName}</h3>
					<p class="text-xs text-muted-foreground">{pkg.description}</p>
					<span class="font-mono text-[0.72rem] text-foreground">{pkg.installCommand}</span>
				</a>
			{/each}
		</div>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Top Pixelart Icon Categories</h2>
		<div class="flex flex-wrap gap-2">
			{#each topCategories as category (category.slug)}
				<a
					href={`/icons/lucide/categories/${category.slug}`}
					class="rounded-full border border-[var(--line)] px-3 py-1 text-xs no-underline transition-colors hover:border-[var(--line-strong)]"
				>
					{category.tag} ({category.iconCount})
				</a>
			{/each}
		</div>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Featured Pixelart Lucide Icons</h2>
		<div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
			{#each featuredIcons as icon (icon.id)}
				<a
					href={`/icons/lucide/${icon.id}`}
					class="rounded-lg border border-[var(--line)] p-3 text-xs no-underline transition-colors hover:border-[var(--line-strong)]"
				>
					<p class="mb-2 font-medium">{icon.name}</p>
					<div class="flex h-14 items-center justify-center">{@html icon.svg}</div>
				</a>
			{/each}
		</div>
	</section>

	<footer class="text-xs text-muted-foreground">
		<p>{SITE_DESCRIPTION}</p>
	</footer>
</article>
