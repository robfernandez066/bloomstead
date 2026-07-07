import { PRODUCTION_RECIPES } from '../data/ProductionRecipes';
import { getItemName } from '../data/Items';
import type {
  ProductionBuildingId,
  ProductionJobState,
  ProductionRecipeDefinition,
  ProductionRecipeId,
  SavedProductionState,
  ProductionState
} from '../models/ProductionTypes';
import type { ItemId } from '../models/ItemTypes';
import type { GameStateSystem } from './GameStateSystem';

const DEFAULT_JOB_STATE: ProductionJobState = {
  status: 'idle',
  recipeId: null,
  startedAt: null,
  durationMs: null
};

const PRODUCTION_BUILDINGS: ProductionBuildingId[] = ['mill', 'bakery'];

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

  constructor(gameState: GameStateSystem, initialState?: SavedProductionState) {
    this.gameState = gameState;
    this.state = this.normalizeState(initialState);
    this.refreshProductionState();
  }

  getState(): ProductionState {
    return this.state;
  }

  getAvailableRecipes(): ProductionRecipeDefinition[] {
    return Object.values(PRODUCTION_RECIPES);
  }

  getRecipeState(recipeId: ProductionRecipeId): ProductionJobState {
    return this.state[PRODUCTION_RECIPES[recipeId].buildingId];
  }

  getActiveRecipes(): ProductionRecipeDefinition[] {
    return this.getAvailableRecipes().filter((recipe) => {
      return this.getRecipeState(recipe.id).status !== 'idle';
    });
  }

  hasProducingJobs(): boolean {
    return this.getAvailableRecipes().some((recipe) => {
      return this.getRecipeState(recipe.id).status === 'producing';
    });
  }

  getItemCount(itemId: ItemId): number {
    return this.gameState.getItemCount(itemId);
  }

  canStartRecipe(recipeId: ProductionRecipeId): boolean {
    const recipe = PRODUCTION_RECIPES[recipeId];
    const state = this.state[recipe.buildingId];

    if (state.status !== 'idle') {
      return false;
    }

    return this.gameState.hasItemInventory(recipe.input);
  }

  startRecipe(recipeId: ProductionRecipeId): ProductionStartResult | null {
    const recipe = PRODUCTION_RECIPES[recipeId];

    if (!this.canStartRecipe(recipe.id)) {
      return null;
    }

    if (!this.gameState.removeItemInventory(recipe.input)) {
      return null;
    }

    const state = this.state[recipe.buildingId];

    state.status = 'producing';
    state.recipeId = recipe.id;
    state.startedAt = Date.now();
    state.durationMs = recipe.durationMs;

    return { recipe };
  }

  collectReadyOutput(recipeId: ProductionRecipeId): ProductionCollectResult | null {
    this.refreshProductionState();
    const state = this.getRecipeState(recipeId);

    if (state.status !== 'ready' || state.recipeId !== recipeId) {
      return null;
    }

    const recipe = PRODUCTION_RECIPES[state.recipeId];

    this.gameState.addItemToInventory(recipe.outputItemId, recipe.outputAmount);
    state.status = 'idle';
    state.recipeId = null;
    state.startedAt = null;
    state.durationMs = null;

    return {
      recipe,
      outputName: getItemName(recipe.outputItemId),
      outputAmount: recipe.outputAmount
    };
  }

  getRemainingMs(recipeId: ProductionRecipeId): number {
    const state = this.getRecipeState(recipeId);

    if (
      state.status !== 'producing' ||
      state.startedAt === null ||
      state.durationMs === null
    ) {
      return 0;
    }

    return Math.max(0, state.durationMs - (Date.now() - state.startedAt));
  }

  refreshProductionState(): ProductionRecipeDefinition[] {
    const becameReady: ProductionRecipeDefinition[] = [];

    for (const recipe of this.getAvailableRecipes()) {
      const state = this.state[recipe.buildingId];

      if (
        state.status !== 'producing' ||
        state.startedAt === null ||
        state.durationMs === null ||
        Date.now() - state.startedAt < state.durationMs
      ) {
        continue;
      }

      state.status = 'ready';
      becameReady.push(recipe);
    }

    return becameReady;
  }

  private normalizeState(initialState?: SavedProductionState): ProductionState {
    const normalizedState = this.createDefaultState();

    if (initialState === undefined) {
      return normalizedState;
    }

    if (this.isLegacyJobState(initialState)) {
      normalizedState.mill = this.normalizeJobState('mill', initialState);
      return normalizedState;
    }

    for (const buildingId of PRODUCTION_BUILDINGS) {
      normalizedState[buildingId] = this.normalizeJobState(buildingId, initialState[buildingId]);
    }

    return normalizedState;
  }

  private createDefaultState(): ProductionState {
    return {
      mill: { ...DEFAULT_JOB_STATE },
      bakery: { ...DEFAULT_JOB_STATE }
    };
  }

  private normalizeJobState(
    buildingId: ProductionBuildingId,
    initialState?: ProductionJobState
  ): ProductionJobState {
    if (
      initialState === undefined ||
      (initialState.status !== 'idle' &&
        initialState.status !== 'producing' &&
        initialState.status !== 'ready')
    ) {
      return { ...DEFAULT_JOB_STATE };
    }

    if (initialState.status === 'idle') {
      return { ...DEFAULT_JOB_STATE };
    }

    if (
      initialState.recipeId === null ||
      PRODUCTION_RECIPES[initialState.recipeId] === undefined ||
      PRODUCTION_RECIPES[initialState.recipeId].buildingId !== buildingId
    ) {
      return { ...DEFAULT_JOB_STATE };
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

  private isLegacyJobState(state: SavedProductionState): state is ProductionJobState {
    return 'status' in state;
  }
}
