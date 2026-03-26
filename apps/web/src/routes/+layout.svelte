<script lang="ts">
	import './layout.css';
	import 'geist-svelte/font/pixel';
	import 'geist-svelte/font/mono';

	import favicon from '$lib/assets/favicon.svg';
	import Logo from '$lib/components/logo.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mx-auto flex max-w-310 flex-col gap-4 p-4 py-2">
	<header class="">
		<div class="group flex cursor-pointer items-center justify-start">
			<Logo class="h-15 w-20 transition-transform group-hover:scale-110" />
			<h2 class="text-2xl">pxicons</h2>
		</div>
	</header>

	{@render children()}
</main>
