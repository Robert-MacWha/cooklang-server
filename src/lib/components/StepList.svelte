<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { Section } from '$lib/types';

	let { sections }: { sections: Section[] } = $props();

	let checked = new SvelteSet<string>();

	function toggle(key: string) {
		if (checked.has(key)) checked.delete(key);
		else checked.add(key);
	}
</script>

{#each sections as section, sIndex}
	{#if section.name}
		<h2 class="mt-6 mb-2 text-base font-medium text-slate-800">{section.name}</h2>
	{:else if sections.length > 1}
		<h2 class="mt-6 mb-2 text-base font-medium text-slate-800">Section {sIndex + 1}</h2>
	{/if}

	<ol class="space-y-4">
		{#each section.content as content, cIndex}
			{#if content.type === 'text'}
				<p class="text-sm text-slate-500 italic">{content.value}</p>
			{:else}
				{@const key = `${sIndex}:${cIndex}`}
				<li>
					<button
						type="button"
						onclick={() => toggle(key)}
						class="flex w-full cursor-pointer gap-3 text-left leading-relaxed text-slate-700 {checked.has(
							key
						)
							? 'text-slate-400 opacity-60 line-through'
							: ''}"
					>
						<span
							class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent text-sm font-medium text-white"
							>{content.number}</span
						>
						<p>
							{#each content.items as item}
								{#if item.type === 'text'}{item.value}
								{:else if item.type === 'timer'}<span class="font-bold text-slate-900"
										>{item.name ? `${item.name}: ` : ''}{item.quantity}</span
									>
								{:else}<span class="font-bold text-slate-900"
										>{item.name}{item.quantity ? ` (${item.quantity})` : ''}</span
									>
								{/if}
							{/each}
						</p>
					</button>
				</li>
			{/if}
		{/each}
	</ol>
{/each}
