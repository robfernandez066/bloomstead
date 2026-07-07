import { CROPS, MVP_CROPS } from '../data/Crops';
import { isCropId } from '../data/Items';
import { getFarmLevelForXp } from '../data/LevelProgression';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { CropInventory, GameState } from '../models/GameStateTypes';
import type { ItemId, ProcessedGoodInventory } from '../models/ItemTypes';

const STARTING_CROP_INVENTORY: CropInventory = {
  sunwheat: 0,
  carrot: 0,
  glowberry: 0
};

const STARTING_PROCESSED_GOOD_INVENTORY: ProcessedGoodInventory = {
  flour: 0
};

export interface FarmXpResult {
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
}

export class GameStateSystem {
  private readonly state: GameState;

  constructor(initialState?: GameState) {
    this.state = {
      ...(initialState ?? {
        coins: 100,
        farmXp: 0,
        farmLevel: 1,
        selectedSeedId: 'sunwheat'
      }),
      cropInventory: {
        ...STARTING_CROP_INVENTORY,
        ...initialState?.cropInventory
      },
      processedGoodInventory: {
        ...STARTING_PROCESSED_GOOD_INVENTORY,
        ...initialState?.processedGoodInventory
      }
    };
  }

  getState(): GameState {
    return this.state;
  }

  getCrops(): CropDefinition[] {
    return MVP_CROPS;
  }

  getSelectedSeed(): CropDefinition {
    return CROPS[this.state.selectedSeedId];
  }

  isCropUnlocked(crop: CropDefinition): boolean {
    return this.state.farmLevel >= crop.unlockLevel;
  }

  canAfford(cost: number): boolean {
    return this.state.coins >= cost;
  }

  spendCoins(amount: number): boolean {
    if (!this.canAfford(amount)) {
      return false;
    }

    this.state.coins -= amount;
    return true;
  }

  addCoins(amount: number): void {
    this.state.coins += amount;
  }

  addCropToInventory(cropId: CropId, amount: number): void {
    this.state.cropInventory[cropId] += amount;
  }

  addItemToInventory(itemId: ItemId, amount: number): void {
    if (isCropId(itemId)) {
      this.state.cropInventory[itemId] += amount;
      return;
    }

    this.state.processedGoodInventory[itemId] += amount;
  }

  getItemCount(itemId: ItemId): number {
    if (isCropId(itemId)) {
      return this.state.cropInventory[itemId];
    }

    return this.state.processedGoodInventory[itemId];
  }

  hasCropInventory(requirements: Partial<CropInventory>): boolean {
    return this.hasItemInventory(requirements);
  }

  hasItemInventory(requirements: Partial<Record<ItemId, number>>): boolean {
    return Object.entries(requirements).every(([itemId, count]) => {
      return count === undefined || this.getItemCount(itemId as ItemId) >= count;
    });
  }

  removeCropInventory(requirements: Partial<CropInventory>): boolean {
    return this.removeItemInventory(requirements);
  }

  removeItemInventory(requirements: Partial<Record<ItemId, number>>): boolean {
    if (!this.hasItemInventory(requirements)) {
      return false;
    }

    Object.entries(requirements).forEach(([itemId, count]) => {
      if (count !== undefined) {
        const typedItemId = itemId as ItemId;

        if (isCropId(typedItemId)) {
          this.state.cropInventory[typedItemId] -= count;
        } else {
          this.state.processedGoodInventory[typedItemId] -= count;
        }
      }
    });

    return true;
  }

  addFarmXp(amount: number): FarmXpResult {
    const previousLevel = this.state.farmLevel;

    this.state.farmXp += amount;
    this.state.farmLevel = getFarmLevelForXp(this.state.farmXp);

    return {
      previousLevel,
      currentLevel: this.state.farmLevel,
      leveledUp: this.state.farmLevel > previousLevel
    };
  }

  selectSeed(cropId: CropId): boolean {
    const crop = CROPS[cropId];

    if (!this.isCropUnlocked(crop)) {
      return false;
    }

    this.state.selectedSeedId = cropId;
    return true;
  }
}
