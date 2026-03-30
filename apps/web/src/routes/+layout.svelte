<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import 'geist-svelte/font/pixel';
	import 'geist-svelte/font/mono';

	import favicon from '$lib/assets/favicon.svg';
	import Logo from '$lib/components/logo.svelte';
	import { Github, Star } from '@pxicons/lucide-svelte';

	let { children } = $props();
	let githubStars = $state('');

	onMount(async () => {
		try {
			const res = await fetch('https://api.github.com/repos/Royserg/pxicons');
			if (!res.ok) return;
			const data = await res.json();
			if (typeof data.stargazers_count === 'number') {
				githubStars = data.stargazers_count.toLocaleString();
			}
		} catch {
			// Silently ignore — badge still shows without count.
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="h-dvh w-dvw overflow-hidden">
	<header class="mx-auto flex max-w-325 items-center justify-between gap-4 px-1">
		<div class="group flex cursor-pointer items-center justify-start">
			<Logo class="h-12 w-20 transition-transform group-hover:scale-110" />
			<h2 class="text-2xl">pxicons</h2>
		</div>

		<a
			href="https://github.com/Royserg/pxicons"
			target="_blank"
			rel="noopener"
			class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink-muted)] no-underline transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
		>
			<Github size={14} />
			{#if githubStars}
				<span
					class="flex items-center gap-1 border-l border-[var(--line)] pl-2.5 font-mono text-[0.72rem] tracking-tight"
				>
					<Star size={12} color="#e3b341" />
					{githubStars}
				</span>
			{/if}
		</a>
	</header>

	<main class="mx-auto flex max-w-310 flex-col gap-4 p-4 py-2">
		{@render children()}
	</main>
</div>
