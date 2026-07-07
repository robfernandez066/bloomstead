import type { ItemId } from './ItemTypes';

export type ProductionBuildingId = 'mill' | 'bakery';
export type ProductionRecipeId = 'mill-flour' | 'bakery-bread';
export type ProductionStatus = 'idle' | 'producing' | 'ready';

export interface ProductionRecipeDefinition {
  id: ProductionRecipeId;
  buildingId: ProductionBuildingId;
  buildingName: string;
  input: Partial<Record<ItemId, number>>;
  outputItemId: ItemId;
  outputAmount: number;
  durationMs: number;
}

export interface ProductionJobState {
  status: ProductionStatus;
  recipeId: ProductionRecipeId | null;
  startedAt: number | null;
  durationMs: number | null;
}

export type ProductionState = Record<ProductionBuildingId, ProductionJobState>;

export type SavedProductionState = ProductionState | ProductionJobState;
