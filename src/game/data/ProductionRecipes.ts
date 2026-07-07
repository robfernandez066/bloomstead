import type { ProductionRecipeDefinition, ProductionRecipeId } from '../models/ProductionTypes';

export const MILL_FLOUR_RECIPE_ID: ProductionRecipeId = 'mill-flour';

export const PRODUCTION_RECIPES: Record<ProductionRecipeId, ProductionRecipeDefinition> = {
  'mill-flour': {
    id: 'mill-flour',
    buildingName: 'Mill',
    input: {
      sunwheat: 2
    },
    outputItemId: 'flour',
    outputAmount: 1,
    durationMs: 15_000
  }
};
