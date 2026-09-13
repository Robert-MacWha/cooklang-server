<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { IngredientLine } from '$lib/types';

	let { title, items }: { title: string; items: IngredientLine[] } = $props();

	let checked = new SvelteSet<number>();

	function toggle(index: number) {
		if (checked.has(index)) checked.delete(index);
		else checked.add(index);
	}
</script>

{#if items.length}
	<section class="mb-4">
		<h2 class="mb-1 text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
		<ul class="space-y-0.75">
			{#each items as item, i}
				<li>
					<button
						type="button"
						onclick={() => toggle(i)}
						class="w-full cursor-pointer rounded px-1 py-0.5 text-left text-sm text-slate-700 {checked.has(
							i
						)
							? 'text-slate-400 opacity-60 line-through'
							: ''}"
					>
						{#if item.quantity}
							<span class="font-medium {checked.has(i) ? '' : 'text-slate-900'}"
								>{item.quantity}</span
							>
						{/if}
						{item.name}
						{#if item.note}
							<span class="text-slate-400">({item.note})</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}
