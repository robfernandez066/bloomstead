import type { ProductionRecipeDefinition, ProductionRecipeId } from '../models/ProductionTypes';

export const MILL_FLOUR_RECIPE_ID: ProductionRecipeId = 'mill-flour';
export const BAKERY_BREAD_RECIPE_ID: ProductionRecipeId = 'bakery-bread';

export const PRODUCTION_RECIPES: Record<ProductionRecipeId, ProductionRecipeDefinition> = {
  'mill-flour': {
    id: 'mill-flour',
    buildingId: 'mill',
    buildingName: 'Mill',
    unlockLevel: 2,
    input: {
      sunwheat: 2
    },
    outputItemId: 'flour',
    outputAmount: 1,
    durationMs: 15_000
  },
  'bakery-bread': {
    id: 'bakery-bread',
    buildingId: 'bakery',
    buildingName: 'Bakery',
    unlockLevel: 3,
    input: {
      flour: 2
    },
    outputItemId: 'bread',
    outputAmount: 1,
    durationMs: 30_000
  }
};
