<script lang="ts">
	import type { IngredientLine } from '$lib/types';

	let { title, items }: { title: string; items: IngredientLine[] } = $props();
</script>

{#if items.length}
	<section class="mb-6">
		<h2 class="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
		<ul class="space-y-1.5">
			{#each items as item}
				<li class="text-sm text-slate-700">
					{#if item.quantity}
						<span class="font-medium text-slate-900">{item.quantity}</span>
					{/if}
					{item.name}
					{#if item.note}
						<span class="text-slate-400">({item.note})</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}
