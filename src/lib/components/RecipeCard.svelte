<script lang="ts">
	import type { RecipeSummary } from '$lib/types';

	let { recipe }: { recipe: RecipeSummary } = $props();
</script>

<a
	href="/recipe/{recipe.slug}"
	class="block rounded-xl bg-white p-4 shadow-none ring-1 ring-slate-200 transition hover:ring-slate-300"
>
	<h2 class="font-medium text-slate-800">{recipe.starred ? '⭐ ' : ''}{recipe.title}</h2>
	{#if recipe.broken}
		<p class="mt-1 text-sm text-slate-500">⚠ Failed to parse</p>
	{:else if recipe.time}
		<p class="mt-1 text-sm text-slate-500">{recipe.time}</p>
	{/if}
	{#if recipe.cuisine || recipe.tags.length}
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#if recipe.cuisine}
				<span class="rounded-full bg-accent px-2 py-0.5 text-sm text-white capitalize"
					>{recipe.cuisine}</span
				>
			{/if}
			{#each recipe.tags as tag}
				<span class="rounded-full bg-accent px-2 py-0.5 text-sm text-white capitalize">{tag}</span
				>
			{/each}
		</div>
	{/if}
</a>
