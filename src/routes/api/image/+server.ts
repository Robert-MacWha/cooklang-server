import { error } from '@sveltejs/kit';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { getRecipeImagePath } from '$lib/server/recipes';
import type { RequestHandler } from './$types';

const CONTENT_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml'
};

export const GET: RequestHandler = ({ url }) => {
	const slug = url.searchParams.get('slug');
	if (!slug) error(400, 'Missing slug');

	const imagePath = getRecipeImagePath(slug);
	if (!imagePath) error(404, 'Image not found');

	const contentType = CONTENT_TYPES[extname(imagePath).toLowerCase()] ?? 'application/octet-stream';
	return new Response(readFileSync(imagePath), {
		headers: { 'content-type': contentType }
	});
};
