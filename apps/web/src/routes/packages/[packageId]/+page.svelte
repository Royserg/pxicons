<script lang="ts">
	import { getCanonicalUrl, joinKeywords, SITE_NAME, SOCIAL_IMAGE_PATH } from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pathname = $derived(`/packages/${data.pkg.id}`);
	const canonicalUrl = $derived(getCanonicalUrl(pathname));
	const title = $derived(`${data.pkg.title} | pxicons`);
	const description = $derived(data.pkg.description);
	const keywordsContent = $derived(joinKeywords(data.pkg.keywords));
	const softwareJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'SoftwareSourceCode',
		name: data.pkg.packageName,
		description,
		url: canonicalUrl,
		codeRepository: 'https://github.com/Royserg/pxicons',
		programmingLanguage: ['TypeScript', 'JavaScript'],
		runtimePlatform: data.pkg.framework,
		license: 'https://opensource.org/licenses/MIT'
	});
	const softwareJsonLdScript = $derived(
		`<script type="application/ld+json">${JSON.stringify(softwareJsonLd)}<\/script>`
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
	{@html softwareJsonLdScript}
</svelte:head>

<article class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-2 py-4">
	<header class="space-y-2">
		<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">package</p>
		<h1 class="text-3xl font-semibold">{data.pkg.packageName}</h1>
		<p class="text-sm text-muted-foreground">{description}</p>
	</header>

	<section class="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
		<h2 class="mb-2 text-lg font-semibold">Install</h2>
		<pre
			class="overflow-x-auto rounded-md border border-[var(--line)] bg-background p-3 text-[0.78rem]"><code
				>{data.pkg.installCommand}</code
			></pre>
	</section>

	<section class="rounded-xl border border-[var(--line)] p-4">
		<h2 class="mb-2 text-lg font-semibold">Usage</h2>
		<pre class="overflow-x-auto text-[0.78rem]"><code>{data.pkg.usageSnippet}</code></pre>
	</section>

	<section class="space-y-2">
		<h2 class="text-lg font-semibold">Best For</h2>
		<p class="text-sm text-muted-foreground">Framework/runtime: {data.pkg.framework}</p>
	</section>

	<nav class="flex flex-wrap gap-3 text-sm">
		<a class="underline" href="/packages">All packages</a>
		<a class="underline" href="/pixelart-lucide-icons">Pixelart Lucide landing page</a>
		<a class="underline" href="/icons/lucide">Search Lucide icons</a>
	</nav>
</article>
