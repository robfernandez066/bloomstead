import type { ItemId } from './ItemTypes';

export type ProductionRecipeId = 'mill-flour';
export type ProductionStatus = 'idle' | 'producing' | 'ready';

export interface ProductionRecipeDefinition {
  id: ProductionRecipeId;
  buildingName: string;
  input: Partial<Record<ItemId, number>>;
  outputItemId: ItemId;
  outputAmount: number;
  durationMs: number;
}

export interface ProductionState {
  status: ProductionStatus;
  recipeId: ProductionRecipeId | null;
  startedAt: number | null;
  durationMs: number | null;
}
