import {
	CooklangParser,
	ingredient_display_name,
	cookware_display_name,
	quantity_display,
	grouped_quantity_display,
	grouped_quantity_is_empty,
	ingredient_should_be_listed,
	cookware_should_be_listed
} from '@cooklang/cooklang';
import type { Ingredient, Cookware, Timer, Section, Step, Item } from '@cooklang/cooklang';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { env } from '$env/dynamic/private';
import { formatTime, formatServings, nameAndUrlLabel, sourceLabel } from '$lib/format';
import type {
	RecipeSummary,
	RecipeDetail,
	IngredientLine,
	SectionContent,
	StepItem
} from '$lib/types';

// Not exported by the package's public types, despite being a real runtime shape.
type GroupedQuantity = Parameters<typeof grouped_quantity_is_empty>[0];

const RECIPES_DIR = resolve(env.RECIPES_DIR || './recipes');

/** Resolves a slug to a `.cook` file path, rejecting anything outside RECIPES_DIR. */
function slugToPath(slug: string): string {
	const filePath = resolve(RECIPES_DIR, `${slug}.cook`);
	const rel = relative(RECIPES_DIR, filePath);
	if (rel.startsWith('..') || rel.split(sep).includes('..')) {
		throw new Error('Invalid recipe slug');
	}
	return filePath;
}

function findCookFiles(dir: string): string[] {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...findCookFiles(fullPath));
		} else if (entry.name.endsWith('.cook')) {
			files.push(fullPath);
		}
	}
	return files;
}

function pathToSlug(filePath: string): string {
	return relative(RECIPES_DIR, filePath).replace(/\.cook$/, '').split(sep).join('/');
}

// Raw metadata values come through as whatever YAML type they were written as
// (e.g. `starred: true` is a boolean, `cuisine: Japanese` is a string), so this
// coerces to a string before we do any string-only operations on it.
function rawMetadataString(rawMetadata: Map<string, unknown>, key: string): string | null {
	const value = rawMetadata.get(key);
	return value == null ? null : String(value);
}

function isStarred(rawMetadata: Map<string, unknown>): boolean {
	const value = rawMetadataString(rawMetadata, 'starred')?.trim().toLowerCase();
	return value === 'true' || value === 'yes' || value === '1';
}

export function listRecipes(): RecipeSummary[] {
	const parser = new CooklangParser();
	const recipes = findCookFiles(RECIPES_DIR).map((filePath): RecipeSummary => {
		const slug = pathToSlug(filePath);
		try {
			const text = readFileSync(filePath, 'utf-8');
			const [recipe] = parser.parse(text, null);
			return {
				slug,
				title: recipe.title || slug,
				tags: [...recipe.tags],
				cuisine: rawMetadataString(recipe.rawMetadata, 'cuisine'),
				time: formatTime(recipe.time),
				starred: isStarred(recipe.rawMetadata),
				broken: false
			};
		} catch {
			// One malformed file shouldn't take down the whole listing.
			return { slug, title: slug, tags: [], cuisine: null, time: null, starred: false, broken: true };
		}
	});

	return recipes.sort((a, b) => {
		const starDiff = Number(b.starred) - Number(a.starred);
		return starDiff || a.title.localeCompare(b.title);
	});
}

function groupedLines<T extends Ingredient | Cookware>(
	grouped: [T, GroupedQuantity][],
	displayName: (x: T) => string,
	shouldList: (x: T) => boolean,
	recipeSlug: (x: T) => string | null = () => null
): IngredientLine[] {
	return grouped
		.filter(([item]) => shouldList(item))
		.map(([item, quantity]) => ({
			name: displayName(item),
			quantity: grouped_quantity_is_empty(quantity) ? null : grouped_quantity_display(quantity),
			note: (item as { note: string | null }).note,
			recipeSlug: recipeSlug(item)
		}))
		.sort((a, b) => Number(!!b.recipeSlug) - Number(!!a.recipeSlug));
}

interface RecipeComponents {
	ingredients: Ingredient[];
	cookware: Cookware[];
	timers: Timer[];
}

/** Resolves an ingredient's recipe reference (e.g. `@./puff-pastry{}`) to a recipe slug. */
function resolveRecipeReference(
	recipeDir: string,
	reference: NonNullable<Ingredient['reference']>
): string | null {
	const relativePath = [...reference.components, reference.name].join('/');
	const targetPath = resolve(recipeDir, `${relativePath}.cook`);
	const rel = relative(RECIPES_DIR, targetPath);
	if (rel.startsWith('..') || rel.split(sep).includes('..') || !existsSync(targetPath)) {
		return null;
	}
	return pathToSlug(targetPath);
}

function mapStepItem(item: Item, recipe: RecipeComponents, recipeDir: string): StepItem {
	switch (item.type) {
		case 'text':
			return { type: 'text', value: item.value };
		case 'ingredient': {
			const ingredient = recipe.ingredients[item.index];
			return {
				type: 'ingredient',
				name: ingredient_display_name(ingredient),
				quantity: ingredient.quantity ? quantity_display(ingredient.quantity) : null,
				recipeSlug: ingredient.reference
					? resolveRecipeReference(recipeDir, ingredient.reference)
					: null
			};
		}
		case 'cookware': {
			const cookware = recipe.cookware[item.index];
			return {
				type: 'cookware',
				name: cookware_display_name(cookware),
				quantity: cookware.quantity ? quantity_display(cookware.quantity) : null
			};
		}
		case 'timer': {
			const timer = recipe.timers[item.index];
			return {
				type: 'timer',
				name: timer.name || null,
				quantity: timer.quantity ? quantity_display(timer.quantity) : null
			};
		}
		default:
			return { type: 'text', value: '' };
	}
}

function mapSections(sections: Section[], recipe: RecipeComponents, recipeDir: string) {
	return sections.map((section) => ({
		name: section.name ?? null,
		content: section.content.map((content): SectionContent => {
			if (content.type === 'text') {
				return { type: 'text', value: content.value };
			}
			const step: Step = content.value;
			return {
				type: 'step',
				number: step.number,
				items: step.items.map((item) => mapStepItem(item, recipe, recipeDir))
			};
		})
	}));
}

/** Thrown when a `.cook` file exists but can't be parsed, so callers can tell it from a missing file. */
export class RecipeParseError extends Error {}

export function loadRecipe(slug: string, scale: number | null): RecipeDetail {
	const filePath = slugToPath(slug);
	const text = readFileSync(filePath, 'utf-8');
	try {
		// The parser traps on some malformed input (e.g. an unnamed `@{1 cup}`)
		// rather than reporting it, and it can do so from any of the wasm calls below.
		return buildRecipeDetail(text, filePath, slug, scale);
	} catch (cause) {
		throw new RecipeParseError(`Failed to parse ${slug}.cook`, { cause });
	}
}

function buildRecipeDetail(
	text: string,
	filePath: string,
	slug: string,
	scale: number | null
): RecipeDetail {
	const parser = new CooklangParser();
	const [recipe] = parser.parse(text, scale);

	const rawImage = rawMetadataString(recipe.rawMetadata, 'image');
	const imageUrl = !rawImage
		? null
		: /^https?:\/\//.test(rawImage)
			? rawImage
			: `/api/image?slug=${encodeURIComponent(slug)}`;

	const recipeDir = dirname(filePath);

	return {
		title: recipe.title || slug,
		description: recipe.description ?? null,
		tags: [...recipe.tags],
		starred: isStarred(recipe.rawMetadata),
		cuisine: rawMetadataString(recipe.rawMetadata, 'cuisine'),
		author: nameAndUrlLabel(recipe.author),
		authorUrl: recipe.author?.url ?? null,
		source: sourceLabel(recipe.source),
		sourceUrl: recipe.source?.url ?? null,
		time: formatTime(recipe.time),
		servings: formatServings(recipe.servings),
		imageUrl,
		ingredients: groupedLines(
			recipe.groupedIngredients,
			ingredient_display_name,
			ingredient_should_be_listed,
			(ingredient) =>
				ingredient.reference ? resolveRecipeReference(recipeDir, ingredient.reference) : null
		),
		cookware: groupedLines(recipe.groupedCookware, cookware_display_name, cookware_should_be_listed),
		sections: mapSections(recipe.sections, recipe, recipeDir)
	};
}

/** Resolves a recipe's local `image` metadata path to an absolute file path, if valid. */
export function getRecipeImagePath(slug: string): string | null {
	const filePath = slugToPath(slug);
	const text = readFileSync(filePath, 'utf-8');
	const parser = new CooklangParser();

	let rawImage: string | null;
	try {
		const [recipe] = parser.parse(text, null);
		rawImage = rawMetadataString(recipe.rawMetadata, 'image');
	} catch {
		return null;
	}

	if (!rawImage || /^https?:\/\//.test(rawImage)) return null;

	const imagePath = resolve(dirname(filePath), rawImage);
	const rel = relative(RECIPES_DIR, imagePath);
	if (rel.startsWith('..') || rel.split(sep).includes('..') || !existsSync(imagePath)) {
		return null;
	}
	return imagePath;
}
