type RecipeTime = number | { prep_time?: number; cook_time?: number } | null | undefined;
type NameAndUrl = { name?: string | null; url?: string | null } | null | undefined;
type Servings = number | string | null | undefined;

function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatTime(time: RecipeTime): string | null {
	if (time == null) return null;
	if (typeof time === 'number') return formatMinutes(time);
	const parts: string[] = [];
	if (time.prep_time != null) parts.push(`Prep ${formatMinutes(time.prep_time)}`);
	if (time.cook_time != null) parts.push(`Cook ${formatMinutes(time.cook_time)}`);
	return parts.length ? parts.join(' · ') : null;
}

export function formatServings(servings: Servings): string | null {
	if (servings == null) return null;
	return typeof servings === 'number' ? `${servings} servings` : servings;
}

export function nameAndUrlLabel(value: NameAndUrl): string | null {
	if (!value) return null;
	return value.name ?? value.url ?? null;
}

/** Like nameAndUrlLabel, but shows just the domain for a bare URL (e.g. "youtube.com"). */
export function sourceLabel(value: NameAndUrl): string | null {
	if (!value) return null;
	if (value.name) return value.name;
	if (value.url) {
		try {
			return new URL(value.url).hostname.replace(/^www\./, '');
		} catch {
			return value.url;
		}
	}
	return null;
}
