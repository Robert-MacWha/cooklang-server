import { error, json } from '@sveltejs/kit';
import { loadRecipe } from '$lib/server/recipes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	const scaleParam = url.searchParams.get('scale');
	const scale = scaleParam ? Number(scaleParam) : null;

	try {
		return json(loadRecipe(params.slug, scale));
	} catch {
		error(404, 'Recipe not found');
	}
};
