<script lang="ts">
	import './layout.css';
	import 'geist-svelte/font/pixel';
	import 'geist-svelte/font/mono';

	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mx-auto flex max-w-310 flex-col gap-4 p-4 py-2">
	<header class="flex justify-start rounded-xl p-2">
		<h2 class="text-3xl">
			<strong>PxIcons</strong>
		</h2>
	</header>

	{@render children()}
</main>
