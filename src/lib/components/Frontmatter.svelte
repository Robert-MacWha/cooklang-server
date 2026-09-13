<script lang="ts">
	import type { RecipeDetail } from '$lib/types';

	let { recipe }: { recipe: RecipeDetail } = $props();
</script>

{#if recipe.imageUrl}
	<img src={recipe.imageUrl} alt={recipe.title} class="mb-4 h-56 w-full rounded-xl object-cover" />
{/if}

<h1 class="text-xl font-medium text-slate-800">{recipe.title}</h1>

{#if recipe.description}
	<p class="mt-1 text-sm text-slate-500">{recipe.description}</p>
{/if}

<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
	{#if recipe.author}
		<span>
			By
			{#if recipe.authorUrl}<a href={recipe.authorUrl} class="underline" target="_blank"
					>{recipe.author}</a
				>{:else}{recipe.author}{/if}
		</span>
	{/if}
	{#if recipe.source}
		<span>
			Source:
			{#if recipe.sourceUrl}<a href={recipe.sourceUrl} class="underline" target="_blank"
					>{recipe.source}</a
				>{:else}{recipe.source}{/if}
		</span>
	{/if}
	{#if recipe.time}<span>{recipe.time}</span>{/if}
	{#if recipe.servings}<span>{recipe.servings}</span>{/if}
</div>

{#if recipe.tags.length}
	<div class="mt-2 flex flex-wrap gap-1">
		{#each recipe.tags as tag}
			<span class="rounded-full bg-accent px-2 py-0.5 text-sm text-white">{tag}</span>
		{/each}
	</div>
{/if}
