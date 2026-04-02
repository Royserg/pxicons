<script lang="ts">
	import { getIconPack, iconCount } from '$lib/icon-catalog';
	import {
		getCanonicalUrl,
		joinKeywords,
		SITE_NAME,
		SOCIAL_IMAGE_PATH,
		toJsonLdScript
	} from '$lib/site';

	const pathname = '/';
	const canonicalUrl = getCanonicalUrl(pathname);
	const lucidePack = getIconPack('lucide');

	const title = 'pxicons | Pixelart Icons for Product Teams';
	const description =
		'pxicons brings pixelart Lucide icons to Svelte, React, and vanilla JavaScript, with fast browsing, install-ready packages, and crawlable icon docs.';
	const keywords = [
		'pixelart lucide icons',
		'pixel art lucide icons',
		'pxicons',
		'pixel icons',
		'lucide icons'
	] as const;

	const websiteJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: canonicalUrl,
		description
	};

	const landingJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description,
		url: canonicalUrl,
		about: ['pixelart lucide icons', 'pixel icons', 'frontend icon packages']
	};

	const frameworkLinks = [
		{
			name: 'JavaScript',
			href: '/packages/lucide',
			svg: `<svg viewBox="0 0 64 64" aria-hidden="true" class="h-14 w-14"><g fill="#f6f6f8"><rect x="10" y="12" width="20" height="4"></rect><rect x="22" y="16" width="4" height="24"></rect><rect x="10" y="40" width="16" height="4"></rect><rect x="10" y="32" width="4" height="8"></rect><rect x="36" y="12" width="18" height="4"></rect><rect x="36" y="16" width="4" height="12"></rect><rect x="36" y="28" width="18" height="4"></rect><rect x="50" y="32" width="4" height="12"></rect><rect x="36" y="44" width="18" height="4"></rect></g></svg>`
		},
		{
			name: 'Svelte',
			href: '/packages/lucide-svelte',
			svg: `<svg viewBox="0 0 64 64" aria-hidden="true" class="h-14 w-14"><g fill="#f6f6f8"><rect x="28" y="8" width="8" height="4"></rect><rect x="24" y="12" width="12" height="4"></rect><rect x="20" y="16" width="12" height="4"></rect><rect x="20" y="20" width="8" height="4"></rect><rect x="24" y="24" width="12" height="4"></rect><rect x="32" y="28" width="12" height="4"></rect><rect x="36" y="32" width="8" height="4"></rect><rect x="32" y="36" width="12" height="4"></rect><rect x="28" y="40" width="12" height="4"></rect><rect x="24" y="44" width="12" height="4"></rect><rect x="24" y="48" width="8" height="4"></rect><rect x="28" y="52" width="8" height="4"></rect></g></svg>`
		},
		{
			name: 'React',
			href: '/packages/lucide-react',
			svg: `<svg viewBox="0 0 64 64" aria-hidden="true" class="h-14 w-14"><g fill="#f6f6f8"><rect x="28" y="28" width="8" height="8"></rect><rect x="14" y="28" width="8" height="4"></rect><rect x="42" y="32" width="8" height="4"></rect><rect x="22" y="16" width="4" height="4"></rect><rect x="38" y="44" width="4" height="4"></rect><rect x="38" y="16" width="4" height="4"></rect><rect x="22" y="44" width="4" height="4"></rect><rect x="18" y="20" width="4" height="4"></rect><rect x="42" y="40" width="4" height="4"></rect><rect x="42" y="20" width="4" height="4"></rect><rect x="18" y="40" width="4" height="4"></rect><rect x="24" y="12" width="4" height="4"></rect><rect x="36" y="48" width="4" height="4"></rect><rect x="36" y="12" width="4" height="4"></rect><rect x="24" y="48" width="4" height="4"></rect><rect x="16" y="24" width="4" height="4"></rect><rect x="44" y="36" width="4" height="4"></rect><rect x="44" y="24" width="4" height="4"></rect><rect x="16" y="36" width="4" height="4"></rect></g></svg>`
		}
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

	{@html toJsonLdScript(websiteJsonLd)}
	{@html toJsonLdScript(landingJsonLd)}
</svelte:head>

<article class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-2 py-4 md:py-8">
	<section
		class="grid gap-6 rounded-[2rem] border border-[var(--line)] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(180deg,_#0d0d10,_#060607)] p-6 md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)] md:p-10"
	>
		<div class="space-y-5">
			<p class="text-[0.72rem] tracking-[0.2em] text-muted-foreground uppercase">pxicons</p>
			<div class="space-y-3">
				<h1 class="max-w-3xl text-4xl leading-tight font-semibold md:text-6xl">
					Pixel icons for the web
				</h1>
				<p class="max-w-2xl text-sm text-muted-foreground md:text-base">
					Pixelart Lucide icons with fast browsing and ready-to-use packages.
				</p>
			</div>
			<div class="flex flex-wrap gap-3">
				<a
					href="/icons"
					class="rounded-full border border-[var(--line-strong)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold no-underline transition-transform hover:-translate-y-0.5"
					style="color: #050506;"
				>
					Browse icons
				</a>
				<a
					href="/pixelart-lucide-icons"
					class="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-foreground no-underline transition-colors hover:border-[var(--line-strong)]"
				>
					Read the Lucide guide
				</a>
			</div>
		</div>

		<div class="grid gap-3">
			<div class="rounded-2xl border border-[var(--line)] bg-black/30 p-5">
				<p class="text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">Live today</p>
				<h2 class="mt-3 text-2xl font-semibold">{iconCount.toLocaleString()} Lucide icons</h2>
				<p class="mt-2 text-sm text-muted-foreground">
					{lucidePack?.description ?? 'Pixel-perfect Lucide icons for fast product UI work.'}
				</p>
				<a class="mt-4 inline-block text-sm underline" href="/icons/lucide">Open Lucide browser</a>
			</div>
		</div>
	</section>

	<section class="py-4 md:py-6">
		<p class="text-center text-[0.72rem] tracking-[0.18em] text-muted-foreground uppercase">
			Available for
		</p>
		<div class="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-8 md:gap-12">
			{#each frameworkLinks as framework (framework.name)}
				<a
					href={framework.href}
					class="group flex h-24 w-24 items-center justify-center no-underline transition-transform hover:-translate-y-1"
					aria-label={framework.name}
				>
					<span class="sr-only">{framework.name}</span>
					<div class="opacity-90 transition-opacity group-hover:opacity-100">
						{@html framework.svg}
					</div>
				</a>
			{/each}
		</div>
	</section>
</article>
