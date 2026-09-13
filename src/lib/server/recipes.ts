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
	const recipes = findCookFiles(RECIPES_DIR).map((filePath) => {
		const text = readFileSync(filePath, 'utf-8');
		const [recipe] = parser.parse(text, null);
		const slug = pathToSlug(filePath);
		return {
			slug,
			title: recipe.title || slug,
			tags: [...recipe.tags],
			time: formatTime(recipe.time),
			starred: isStarred(recipe.rawMetadata)
		};
	});

	return recipes.sort((a, b) => {
		const starDiff = Number(b.starred) - Number(a.starred);
		return starDiff || a.title.localeCompare(b.title);
	});
}

function groupedLines<T extends Ingredient | Cookware>(
	grouped: [T, GroupedQuantity][],
	displayName: (x: T) => string,
	shouldList: (x: T) => boolean
): IngredientLine[] {
	return grouped
		.filter(([item]) => shouldList(item))
		.map(([item, quantity]) => ({
			name: displayName(item),
			quantity: grouped_quantity_is_empty(quantity) ? null : grouped_quantity_display(quantity),
			note: (item as { note: string | null }).note
		}));
}

interface RecipeComponents {
	ingredients: Ingredient[];
	cookware: Cookware[];
	timers: Timer[];
}

function mapStepItem(item: Item, recipe: RecipeComponents): StepItem {
	switch (item.type) {
		case 'text':
			return { type: 'text', value: item.value };
		case 'ingredient': {
			const ingredient = recipe.ingredients[item.index];
			return {
				type: 'ingredient',
				name: ingredient_display_name(ingredient),
				quantity: ingredient.quantity ? quantity_display(ingredient.quantity) : null
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

function mapSections(sections: Section[], recipe: RecipeComponents) {
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
				items: step.items.map((item) => mapStepItem(item, recipe))
			};
		})
	}));
}

export function loadRecipe(slug: string, scale: number | null): RecipeDetail {
	const filePath = slugToPath(slug);
	const text = readFileSync(filePath, 'utf-8');
	const parser = new CooklangParser();
	const [recipe] = parser.parse(text, scale);

	const rawImage = rawMetadataString(recipe.rawMetadata, 'image');
	const imageUrl = !rawImage
		? null
		: /^https?:\/\//.test(rawImage)
			? rawImage
			: `/api/image?slug=${encodeURIComponent(slug)}`;

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
		ingredients: groupedLines(recipe.groupedIngredients, ingredient_display_name, ingredient_should_be_listed),
		cookware: groupedLines(recipe.groupedCookware, cookware_display_name, cookware_should_be_listed),
		sections: mapSections(recipe.sections, recipe)
	};
}

/** Resolves a recipe's local `image` metadata path to an absolute file path, if valid. */
export function getRecipeImagePath(slug: string): string | null {
	const filePath = slugToPath(slug);
	const text = readFileSync(filePath, 'utf-8');
	const parser = new CooklangParser();
	const [recipe] = parser.parse(text, null);

	const rawImage = rawMetadataString(recipe.rawMetadata, 'image');
	if (!rawImage || /^https?:\/\//.test(rawImage)) return null;

	const imagePath = resolve(dirname(filePath), rawImage);
	const rel = relative(RECIPES_DIR, imagePath);
	if (rel.startsWith('..') || rel.split(sep).includes('..') || !existsSync(imagePath)) {
		return null;
	}
	return imagePath;
}
