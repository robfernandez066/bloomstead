import { CROPS, MVP_CROPS } from '../data/Crops';
import { getFarmLevelForXp } from '../data/LevelProgression';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { CropInventory, GameState } from '../models/GameStateTypes';

const STARTING_CROP_INVENTORY: CropInventory = {
  sunwheat: 0,
  carrot: 0,
  glowberry: 0
};

export interface FarmXpResult {
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
}

export class GameStateSystem {
  private readonly state: GameState;

  constructor(initialState?: GameState) {
    this.state = initialState ?? {
      coins: 1000,
      farmXp: 0,
      farmLevel: 1,
      cropInventory: { ...STARTING_CROP_INVENTORY },
      selectedSeedId: 'sunwheat'
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

  hasCropInventory(requirements: Partial<CropInventory>): boolean {
    return Object.entries(requirements).every(([cropId, count]) => {
      return count === undefined || this.state.cropInventory[cropId as CropId] >= count;
    });
  }

  removeCropInventory(requirements: Partial<CropInventory>): boolean {
    if (!this.hasCropInventory(requirements)) {
      return false;
    }

    Object.entries(requirements).forEach(([cropId, count]) => {
      if (count !== undefined) {
        this.state.cropInventory[cropId as CropId] -= count;
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
