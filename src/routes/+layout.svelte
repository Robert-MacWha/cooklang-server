<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen bg-slate-50">
	<header class="border-b border-slate-200 bg-white px-4 py-3">
		<a href="/" class="text-sm font-semibold tracking-wide text-slate-700 uppercase">Recipes</a>
	</header>
	{@render children()}
</div>
