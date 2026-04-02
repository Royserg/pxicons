<script lang="ts">
	import type { PixelIcon } from '@pxicons/lucide';
	import { filterPixelIcons } from '$lib/icon-search';

	interface NavLink {
		label: string;
		href: string;
		isActive?: boolean;
	}

	interface CategoryLink {
		label: string;
		href: string;
		count?: number;
		isActive?: boolean;
	}

	interface Props {
		eyebrow: string;
		title: string;
		description: string;
		searchPlaceholder?: string;
		icons: readonly PixelIcon[];
		iconHrefBase: string;
		packLinks?: readonly NavLink[];
		categoryLinks?: readonly CategoryLink[];
		activeCategoryLabel?: string | null;
		emptyMessage?: string;
	}

	let {
		eyebrow,
		title,
		description,
		searchPlaceholder = 'Search pixel icons...',
		icons,
		iconHrefBase,
		packLinks = [],
		categoryLinks = [],
		activeCategoryLabel = null,
		emptyMessage = 'No icons match this search yet.'
	}: Props = $props();

	let query = $state('');

	const filteredIcons = $derived(filterPixelIcons(icons, query));
	const resultLabel = $derived(
		`${filteredIcons.length} ${filteredIcons.length === 1 ? 'icon' : 'icons'}`
	);

	function toIconHref(icon: PixelIcon): string {
		return `${iconHrefBase}/${icon.id}`;
	}
</script>

<article class="mx-auto flex w-full max-w-7xl flex-col gap-5 px-2 py-4">
	<header class="space-y-3">
		<p class="text-[0.7rem] tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-2">
				<h1 class="text-3xl leading-tight font-semibold md:text-4xl">{title}</h1>
				<p class="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
			</div>
			<p class="text-xs text-muted-foreground">{resultLabel}</p>
		</div>
	</header>

	{#if packLinks.length > 0}
		<nav class="flex flex-wrap gap-2" aria-label="Icon packs">
			{#each packLinks as link (link.href)}
				<a
					href={link.href}
					aria-current={link.isActive ? 'page' : undefined}
					class={`rounded-full border px-3 py-1.5 text-xs no-underline transition-colors ${
						link.isActive
							? 'border-[var(--line-strong)] bg-[var(--surface)] text-foreground'
							: 'border-[var(--line)] text-muted-foreground hover:border-[var(--line-strong)] hover:text-foreground'
					}`}
				>
					{link.label}
				</a>
			{/each}
		</nav>
	{/if}

	{#if categoryLinks.length > 0}
		<section class="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="text-sm font-semibold">Browse by category</h2>
				{#if activeCategoryLabel}
					<span class="text-xs text-muted-foreground">Filtered by {activeCategoryLabel}</span>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				{#each categoryLinks as category (category.href)}
					<a
						href={category.href}
						aria-current={category.isActive ? 'page' : undefined}
						class={`rounded-full border px-3 py-1 text-xs no-underline transition-colors ${
							category.isActive
								? 'border-[var(--line-strong)] bg-background text-foreground'
								: 'border-[var(--line)] text-muted-foreground hover:border-[var(--line-strong)] hover:text-foreground'
						}`}
					>
						{category.label}{#if category.count}
							({category.count}){/if}
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<section class="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
		<div class="border-b border-[var(--line)] p-4">
			<label
				class="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-background px-4 py-3"
			>
				<span class="text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">Search</span>
				<input
					class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none"
					type="search"
					placeholder={searchPlaceholder}
					bind:value={query}
				/>
			</label>
		</div>

		<div class="max-h-[70vh] overflow-y-auto p-4">
			{#if filteredIcons.length === 0}
				<p class="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
			{:else}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each filteredIcons as icon (icon.id)}
						<a
							href={toIconHref(icon)}
							class="flex min-h-40 flex-col rounded-xl border border-[var(--line)] bg-background p-4 no-underline transition-colors transition-transform hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
						>
							<div
								class="mb-4 flex min-h-20 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3"
							>
								<div class="flex h-12 w-12 items-center justify-center">
									{@html icon.svg}
								</div>
							</div>
							<p class="text-sm font-semibold text-foreground">{icon.name}</p>
							<p class="mt-1 text-xs text-muted-foreground">{icon.id}</p>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</article>
