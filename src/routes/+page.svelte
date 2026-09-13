<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { RecipeSummary } from '$lib/types';

	let recipes = $state<RecipeSummary[]>([]);
	let query = $state('');
	let selectedTags = $state<Set<string>>(new Set());

	$effect(() => {
		fetch('/api/recipes')
			.then((r) => r.json())
			.then((data) => (recipes = data));
	});

	const allTags = $derived([...new Set(recipes.flatMap((r) => r.tags))].sort());

	function toggleTag(tag: string) {
		if (selectedTags.has(tag)) selectedTags.delete(tag);
		else selectedTags.add(tag);
	}

	const filtered = $derived(
		recipes.filter((r) => {
			const q = query.trim().toLowerCase();
			const matchesQuery =
				!q || r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q));
			const matchesTags = selectedTags.size === 0 || r.tags.some((t) => selectedTags.has(t));
			return matchesQuery && matchesTags;
		})
	);
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="text-2xl font-medium text-slate-800">Recipes</h1>

	<div class="mt-4 flex gap-2">
		<input
			type="search"
			placeholder="Search by name or tag..."
			bind:value={query}
			class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 outline-none focus:border-slate-500"
		/>

		{#if allTags.length}
			<details class="relative">
				<summary
					class="flex h-11 list-none items-center gap-1 rounded-lg bg-accent px-3 text-white select-none"
				>
					Tags{selectedTags.size ? ` (${selectedTags.size})` : ''}
				</summary>
				<div
					class="absolute right-0 z-10 mt-2 w-56 rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-300"
				>
					<label class="flex items-center gap-2 rounded p-2 hover:bg-slate-100">
						<input
							type="checkbox"
							checked={selectedTags.size === 0}
							onchange={() => selectedTags.clear()}
							class="h-5 w-5"
						/>
						All
					</label>
					{#each allTags as tag}
						<label class="flex items-center gap-2 rounded p-2 hover:bg-slate-100">
							<input
								type="checkbox"
								checked={selectedTags.has(tag)}
								onchange={() => toggleTag(tag)}
								class="h-5 w-5"
							/>
							{tag}
						</label>
					{/each}
				</div>
			</details>
		{/if}
	</div>

	<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each filtered as recipe (recipe.slug)}
			<RecipeCard {recipe} />
		{/each}
	</div>

	{#if recipes.length && !filtered.length}
		<p class="mt-6 text-slate-500">No recipes match your filters.</p>
	{/if}
</div>
