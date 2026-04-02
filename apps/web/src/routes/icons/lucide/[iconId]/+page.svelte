<script lang="ts">
	import {
		getCanonicalUrl,
		joinKeywords,
		SITE_NAME,
		SOCIAL_IMAGE_PATH,
		toJsonLdScript
	} from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const iconPath = $derived(`/icons/lucide/${data.icon.id}`);
	const canonicalUrl = $derived(getCanonicalUrl(iconPath));
	const title = $derived(`${data.icon.name} Pixelart Lucide Icon | pxicons`);
	const description = $derived(
		`Use the ${data.icon.name} pixelart Lucide icon in Svelte, React, or vanilla JavaScript with install-ready snippets from pxicons.`
	);
	const keywords = $derived([
		'pixelart lucide icons',
		'pixel art lucide icons',
		`${data.icon.id} icon`,
		'pxicons'
	]);
	const keywordsContent = $derived(joinKeywords(keywords));
	const iconJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: `${data.icon.name} icon`,
		description,
		url: canonicalUrl,
		keywords: data.icon.tags,
		isPartOf: {
			'@type': 'CollectionPage',
			name: 'pxicons lucide browser',
			url: getCanonicalUrl('/icons/lucide')
		}
	});
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

	{@html toJsonLdScript(iconJsonLd)}
</svelte:head>

<article class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-2 py-4">
	<header class="space-y-3">
		<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">lucide icon</p>
		<h1 class="text-3xl font-semibold">{data.icon.name}</h1>
		<p class="text-sm text-muted-foreground">
			Icon id: <code>{data.icon.id}</code> · Library: <code>{data.icon.library}</code>
		</p>
	</header>

	<section class="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
		<h2 class="mb-3 text-xl font-semibold">Preview</h2>
		<div
			class="flex min-h-40 items-center justify-center rounded-lg border border-[var(--line)] bg-background p-4"
		>
			{@html data.icon.svg}
		</div>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Usage</h2>
		<div class="grid gap-3 md:grid-cols-3">
			<div class="rounded-lg border border-[var(--line)] p-3">
				<p class="mb-2 text-sm font-semibold">Svelte</p>
				<pre class="overflow-x-auto text-[0.72rem]"><code>{data.svelteSnippet}</code></pre>
			</div>
			<div class="rounded-lg border border-[var(--line)] p-3">
				<p class="mb-2 text-sm font-semibold">React</p>
				<pre class="overflow-x-auto text-[0.72rem]"><code>{data.reactSnippet}</code></pre>
			</div>
			<div class="rounded-lg border border-[var(--line)] p-3">
				<p class="mb-2 text-sm font-semibold">Vanilla</p>
				<pre class="overflow-x-auto text-[0.72rem]"><code>{data.vanillaSnippet}</code></pre>
			</div>
		</div>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Tags</h2>
		<div class="flex flex-wrap gap-2">
			{#each data.tagLinks as tagLink (tagLink.tag)}
				<a
					href={tagLink.href}
					class="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs no-underline transition-colors hover:border-[var(--line-strong)]"
				>
					{tagLink.tag}
				</a>
			{/each}
		</div>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Related Icons</h2>
		<div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each data.relatedIcons as icon (icon.id)}
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

	<nav class="flex flex-wrap gap-3 text-sm">
		<a class="underline" href="/icons/lucide">Browse Lucide icons</a>
		<a class="underline" href="/icons/lucide/categories">Browse categories</a>
		<a class="underline" href="/pixelart-lucide-icons">Pixelart Lucide guide</a>
	</nav>
</article>
