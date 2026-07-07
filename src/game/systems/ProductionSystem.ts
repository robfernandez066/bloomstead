import { PRODUCTION_RECIPES } from '../data/ProductionRecipes';
import { getItemName } from '../data/Items';
import type {
  ProductionRecipeDefinition,
  ProductionRecipeId,
  ProductionState
} from '../models/ProductionTypes';
import type { ItemId } from '../models/ItemTypes';
import type { GameStateSystem } from './GameStateSystem';

const DEFAULT_PRODUCTION_STATE: ProductionState = {
  status: 'idle',
  recipeId: null,
  startedAt: null,
  durationMs: null
};

export interface ProductionStartResult {
  recipe: ProductionRecipeDefinition;
}

export interface ProductionCollectResult {
  recipe: ProductionRecipeDefinition;
  outputName: string;
  outputAmount: number;
}

export class ProductionSystem {
  private readonly gameState: GameStateSystem;
  private readonly state: ProductionState;

  constructor(gameState: GameStateSystem, initialState?: ProductionState) {
    this.gameState = gameState;
    this.state = this.normalizeState(initialState);
    this.refreshProductionState();
  }

  getState(): ProductionState {
    return this.state;
  }

  getCurrentRecipe(): ProductionRecipeDefinition {
    return PRODUCTION_RECIPES['mill-flour'];
  }

  getAvailableRecipes(): ProductionRecipeDefinition[] {
    return [this.getCurrentRecipe()];
  }

  getItemCount(itemId: ItemId): number {
    return this.gameState.getItemCount(itemId);
  }

  canStartRecipe(recipeId: ProductionRecipeId): boolean {
    if (this.state.status !== 'idle') {
      return false;
    }

    return this.gameState.hasItemInventory(PRODUCTION_RECIPES[recipeId].input);
  }

  startRecipe(recipeId: ProductionRecipeId): ProductionStartResult | null {
    const recipe = PRODUCTION_RECIPES[recipeId];

    if (!this.canStartRecipe(recipe.id)) {
      return null;
    }

    if (!this.gameState.removeItemInventory(recipe.input)) {
      return null;
    }

    this.state.status = 'producing';
    this.state.recipeId = recipe.id;
    this.state.startedAt = Date.now();
    this.state.durationMs = recipe.durationMs;

    return { recipe };
  }

  collectReadyOutput(): ProductionCollectResult | null {
    this.refreshProductionState();

    if (this.state.status !== 'ready' || this.state.recipeId === null) {
      return null;
    }

    const recipe = PRODUCTION_RECIPES[this.state.recipeId];

    this.gameState.addItemToInventory(recipe.outputItemId, recipe.outputAmount);
    this.state.status = 'idle';
    this.state.recipeId = null;
    this.state.startedAt = null;
    this.state.durationMs = null;

    return {
      recipe,
      outputName: getItemName(recipe.outputItemId),
      outputAmount: recipe.outputAmount
    };
  }

  getRemainingMs(): number {
    if (
      this.state.status !== 'producing' ||
      this.state.startedAt === null ||
      this.state.durationMs === null
    ) {
      return 0;
    }

    return Math.max(0, this.state.durationMs - (Date.now() - this.state.startedAt));
  }

  refreshProductionState(): boolean {
    if (
      this.state.status !== 'producing' ||
      this.state.startedAt === null ||
      this.state.durationMs === null
    ) {
      return false;
    }

    if (Date.now() - this.state.startedAt < this.state.durationMs) {
      return false;
    }

    this.state.status = 'ready';
    return true;
  }

  private normalizeState(initialState?: ProductionState): ProductionState {
    if (
      initialState === undefined ||
      (initialState.status !== 'idle' &&
        initialState.status !== 'producing' &&
        initialState.status !== 'ready')
    ) {
      return { ...DEFAULT_PRODUCTION_STATE };
    }

    if (initialState.status === 'idle') {
      return { ...DEFAULT_PRODUCTION_STATE };
    }

    if (
      initialState.recipeId === null ||
      PRODUCTION_RECIPES[initialState.recipeId] === undefined
    ) {
      return { ...DEFAULT_PRODUCTION_STATE };
    }

    return {
      status: initialState.status,
      recipeId: initialState.recipeId,
      startedAt: typeof initialState.startedAt === 'number' ? initialState.startedAt : Date.now(),
      durationMs:
        typeof initialState.durationMs === 'number'
          ? initialState.durationMs
          : PRODUCTION_RECIPES[initialState.recipeId].durationMs
    };
  }
}
