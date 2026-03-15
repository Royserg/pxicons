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

<main>
	{@render children()}
</main>
