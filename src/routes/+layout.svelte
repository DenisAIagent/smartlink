<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	// Simple layout without complex dependencies
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<main>
	<slot />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f8fafc;
		color: #334155;
		line-height: 1.6;
	}
	
	:global(*) {
		box-sizing: border-box;
	}
	
	:global(h1, h2, h3, h4, h5, h6) {
		margin-top: 0;
		line-height: 1.2;
	}
	
	:global(a) {
		color: inherit;
		text-decoration: none;
	}
	
	main {
		min-height: 100vh;
	}
</style>