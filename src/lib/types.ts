export interface RecipeSummary {
	slug: string;
	title: string;
	tags: string[];
	cuisine: string | null;
	time: string | null;
	starred: boolean;
}

export interface IngredientLine {
	name: string;
	quantity: string | null;
	note: string | null;
	recipeSlug: string | null;
}

export type StepItem =
	| { type: 'text'; value: string }
	| { type: 'ingredient'; name: string; quantity: string | null; recipeSlug: string | null }
	| { type: 'cookware'; name: string; quantity: string | null }
	| { type: 'timer'; name: string | null; quantity: string | null };

export type SectionContent =
	| { type: 'text'; value: string }
	| { type: 'step'; number: number; items: StepItem[] };

export interface Section {
	name: string | null;
	content: SectionContent[];
}

export interface RecipeDetail {
	title: string;
	description: string | null;
	tags: string[];
	starred: boolean;
	cuisine: string | null;
	author: string | null;
	authorUrl: string | null;
	source: string | null;
	sourceUrl: string | null;
	time: string | null;
	servings: string | null;
	imageUrl: string | null;
	ingredients: IngredientLine[];
	cookware: IngredientLine[];
	sections: Section[];
}
