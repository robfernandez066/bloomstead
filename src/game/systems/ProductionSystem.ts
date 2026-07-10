import { PRODUCTION_RECIPES } from '../data/ProductionRecipes';
import { getItemName } from '../data/Items';
import type {
  ProductionBuildingId,
  ProductionJobState,
  ProductionRecipeDefinition,
  ProductionRecipeId,
  SavedProductionJobState,
  SavedProductionState,
  ProductionState
} from '../models/ProductionTypes';
import type { ItemId } from '../models/ItemTypes';
import type { GameStateSystem } from './GameStateSystem';

const DEFAULT_JOB_STATE: ProductionJobState = {
  status: 'idle',
  recipeId: null,
  startedAt: null,
  durationMs: null,
  quantity: 1,
  collectedQuantity: 0
};

const PRODUCTION_BUILDINGS: ProductionBuildingId[] = ['mill', 'bakery'];
const MAX_BATCH_QUANTITY = 10;

export interface ProductionStartResult {
  recipe: ProductionRecipeDefinition;
  quantity: number;
  durationMs: number;
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

  isRecipeUnlocked(recipeId: ProductionRecipeId): boolean {
    return this.gameState.getState().farmLevel >= PRODUCTION_RECIPES[recipeId].unlockLevel;
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

  getMaxCraftableQuantity(recipeId: ProductionRecipeId): number {
    const recipe = PRODUCTION_RECIPES[recipeId];

    const maxFromIngredients = Object.entries(recipe.input).reduce(
      (currentMax, [itemId, count]) => {
        if (count === undefined || count <= 0) {
          return currentMax;
        }

        return Math.min(
          currentMax,
          Math.floor(this.gameState.getItemCount(itemId as ItemId) / count)
        );
      },
      Number.POSITIVE_INFINITY
    );

    if (!Number.isFinite(maxFromIngredients)) {
      return 0;
    }

    return Math.max(0, Math.min(MAX_BATCH_QUANTITY, Math.floor(maxFromIngredients)));
  }

  canStartRecipe(recipeId: ProductionRecipeId, quantity = 1): boolean {
    const recipe = PRODUCTION_RECIPES[recipeId];
    const state = this.state[recipe.buildingId];

    if (
      !this.isRecipeUnlocked(recipeId) ||
      state.status !== 'idle' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return false;
    }

    return quantity <= this.getMaxCraftableQuantity(recipeId);
  }

  startRecipe(recipeId: ProductionRecipeId, quantity = 1): ProductionStartResult | null {
    const recipe = PRODUCTION_RECIPES[recipeId];
    const batchQuantity = Math.floor(quantity);

    if (!this.canStartRecipe(recipe.id, batchQuantity)) {
      return null;
    }

    const batchInput = this.createBatchInput(recipe, batchQuantity);

    if (!this.gameState.removeItemInventory(batchInput)) {
      return null;
    }

    const state = this.state[recipe.buildingId];
    const durationMs = recipe.durationMs * batchQuantity;

    state.status = 'producing';
    state.recipeId = recipe.id;
    state.startedAt = Date.now();
    state.durationMs = durationMs;
    state.quantity = batchQuantity;
    state.collectedQuantity = 0;

    return { recipe, quantity: batchQuantity, durationMs };
  }

  collectReadyOutput(recipeId: ProductionRecipeId): ProductionCollectResult | null {
    this.refreshProductionState();
    const state = this.getRecipeState(recipeId);

    if (state.recipeId !== recipeId) {
      return null;
    }

    const recipe = PRODUCTION_RECIPES[state.recipeId];
    const quantity = state.quantity;
    const claimableQuantity = this.getClaimableQuantity(recipeId);

    if (claimableQuantity <= 0) {
      return null;
    }

    const outputAmount = recipe.outputAmount * claimableQuantity;
    const collectedQuantity = state.collectedQuantity + claimableQuantity;

    this.gameState.addItemToInventory(recipe.outputItemId, outputAmount);

    if (collectedQuantity >= quantity) {
      state.status = 'idle';
      state.recipeId = null;
      state.startedAt = null;
      state.durationMs = null;
      state.quantity = 1;
      state.collectedQuantity = 0;
    } else {
      state.status = 'producing';
      state.collectedQuantity = collectedQuantity;
    }

    return {
      recipe,
      outputName: getItemName(recipe.outputItemId),
      outputAmount
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

  getNextClaimRemainingMs(recipeId: ProductionRecipeId): number {
    const state = this.getRecipeState(recipeId);

    if (
      state.recipeId !== recipeId ||
      state.startedAt === null
    ) {
      return 0;
    }

    if (state.status === 'ready') {
      return 0;
    }

    const recipe = PRODUCTION_RECIPES[recipeId];
    const completedQuantity = this.getCompletedQuantity(recipeId);

    if (completedQuantity >= state.quantity) {
      return 0;
    }

    const nextUnitReadyAt = state.startedAt + recipe.durationMs * (completedQuantity + 1);

    return Math.max(0, nextUnitReadyAt - Date.now());
  }

  getClaimableQuantity(recipeId: ProductionRecipeId): number {
    const state = this.getRecipeState(recipeId);

    if (
      state.recipeId !== recipeId ||
      state.startedAt === null
    ) {
      return 0;
    }

    const completedQuantity =
      state.status === 'ready'
        ? state.quantity
        : this.getCompletedQuantity(recipeId);
    const collectedQuantity = state.collectedQuantity;

    return Math.max(0, completedQuantity - collectedQuantity);
  }

  getRemainingQuantity(recipeId: ProductionRecipeId): number {
    const state = this.getRecipeState(recipeId);

    if (state.recipeId !== recipeId) {
      return 0;
    }

    return Math.max(0, state.quantity - state.collectedQuantity);
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
    initialState?: SavedProductionJobState
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

    const quantity =
      typeof initialState.quantity === 'number' && initialState.quantity > 0
        ? Math.floor(initialState.quantity)
        : 1;
    const collectedQuantity =
      typeof initialState.collectedQuantity === 'number' && initialState.collectedQuantity > 0
        ? Math.min(quantity, Math.floor(initialState.collectedQuantity))
        : 0;

    if (collectedQuantity >= quantity) {
      return { ...DEFAULT_JOB_STATE };
    }

    return {
      status: initialState.status,
      recipeId: initialState.recipeId,
      startedAt: typeof initialState.startedAt === 'number' ? initialState.startedAt : Date.now(),
      quantity,
      collectedQuantity,
      durationMs:
        typeof initialState.durationMs === 'number'
          ? initialState.durationMs
          : PRODUCTION_RECIPES[initialState.recipeId].durationMs * quantity
    };
  }

  private createBatchInput(
    recipe: ProductionRecipeDefinition,
    quantity: number
  ): Partial<Record<ItemId, number>> {
    return Object.entries(recipe.input).reduce<Partial<Record<ItemId, number>>>(
      (requirements, [itemId, count]) => {
        if (count !== undefined) {
          requirements[itemId as ItemId] = count * quantity;
        }

        return requirements;
      },
      {}
    );
  }

  private getCompletedQuantity(recipeId: ProductionRecipeId): number {
    const state = this.getRecipeState(recipeId);

    if (
      state.recipeId !== recipeId ||
      state.startedAt === null
    ) {
      return 0;
    }

    const recipe = PRODUCTION_RECIPES[recipeId];
    const elapsedMs = Math.max(0, Date.now() - state.startedAt);

    return Math.max(
      0,
      Math.min(state.quantity, Math.floor(elapsedMs / recipe.durationMs))
    );
  }

  private isLegacyJobState(state: SavedProductionState): state is SavedProductionJobState {
    return 'status' in state;
  }
}
