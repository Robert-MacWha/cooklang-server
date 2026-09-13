<script lang="ts">
	import { page } from '$app/state';
	import Frontmatter from '$lib/components/Frontmatter.svelte';
	import IngredientList from '$lib/components/IngredientList.svelte';
	import StepList from '$lib/components/StepList.svelte';
	import type { RecipeDetail } from '$lib/types';

	let recipe = $state<RecipeDetail | null>(null);
	let scale = $state(1);
	let notFound = $state(false);

	$effect(() => {
		const slug = page.params.slug;
		const currentScale = scale;
		notFound = false;
		fetch(`/api/recipes/${slug}?scale=${currentScale}`).then((r) => {
			if (!r.ok) {
				notFound = true;
				return;
			}
			r.json().then((d) => (recipe = d));
		});
	});
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	{#if notFound}
		<p class="text-sm text-slate-500">Recipe not found.</p>
	{:else if recipe}
		<div class="space-y-6">
			<div class="rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
				<Frontmatter {recipe} {scale} onScaleChange={(s) => (scale = s)} />
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_2fr]">
				<div class="rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
					<IngredientList title="Ingredients" items={recipe.ingredients} />
					<IngredientList title="Cookware" items={recipe.cookware} />
				</div>
				<div class="rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
					<StepList sections={recipe.sections} />
				</div>
			</div>
		</div>
	{/if}
</div>
