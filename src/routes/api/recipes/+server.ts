import { json } from '@sveltejs/kit';
import { listRecipes } from '$lib/server/recipes';

export function GET() {
	return json(listRecipes());
}
