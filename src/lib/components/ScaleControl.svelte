<script lang="ts">
	let { scale, onchange }: { scale: number; onchange: (scale: number) => void } = $props();
	const STEP = 0.5;
	const MIN = 0.5;

	function nudge(delta: number) {
		onchange(Math.max(MIN, Math.round((scale + delta) / STEP) * STEP));
	}

	function onInput(e: Event) {
		const value = Number((e.target as HTMLInputElement).value);
		if (!Number.isNaN(value) && value > 0) onchange(value);
	}
</script>

<div class="inline-flex items-center overflow-hidden rounded-lg ring-1 ring-slate-300">
	<button
		type="button"
		onclick={() => nudge(-STEP)}
		aria-label="Decrease scale"
		class="flex h-7 w-7 items-center justify-center bg-accent text-sm font-bold text-white active:bg-accent/80"
	>
		−
	</button>
	<input
		type="number"
		step={STEP}
		min={MIN}
		value={scale}
		oninput={onInput}
		class="h-7 w-10 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	<button
		type="button"
		onclick={() => nudge(STEP)}
		aria-label="Increase scale"
		class="flex h-7 w-7 items-center justify-center bg-accent text-sm font-bold text-white active:bg-accent/80"
	>
		+
	</button>
</div>
