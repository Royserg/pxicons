<script lang="ts">
	import { packageDocs } from '$lib/package-docs';
	import { getCanonicalUrl, joinKeywords, SITE_NAME, SOCIAL_IMAGE_PATH } from '$lib/site';

	const pathname = '/packages';
	const canonicalUrl = getCanonicalUrl(pathname);
	const title = 'pxicons Package Docs | Pixelart Lucide Icons';
	const description =
		'Compare pxicons packages for Svelte, React, and vanilla JavaScript, with install commands and usage snippets.';
	const keywords = [
		'pixelart lucide icons',
		'npm icon packages',
		'svelte icons',
		'react icons',
		'svg icons'
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

<article class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-2 py-4">
	<header class="space-y-2">
		<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">package docs</p>
		<h1 class="text-3xl font-semibold">pxicons Packages</h1>
		<p class="text-sm text-muted-foreground">
			Each package page includes install, usage snippets, and structured metadata for search
			engines.
		</p>
	</header>

	<section class="grid gap-3 md:grid-cols-3">
		{#each packageDocs as pkg (pkg.id)}
			<a
				href={`/packages/${pkg.id}`}
				class="rounded-lg border border-[var(--line)] p-4 no-underline transition-colors hover:border-[var(--line-strong)]"
			>
				<h2 class="text-sm font-semibold">{pkg.packageName}</h2>
				<p class="mt-2 text-xs text-muted-foreground">{pkg.description}</p>
				<p class="mt-3 font-mono text-[0.72rem]">{pkg.installCommand}</p>
			</a>
		{/each}
	</section>
</article>
