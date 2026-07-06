import { CROPS, MVP_CROPS } from '../data/Crops';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { CropInventory, GameState } from '../models/GameStateTypes';

const STARTING_CROP_INVENTORY: CropInventory = {
  sunwheat: 0,
  carrot: 0,
  glowberry: 0
};

export class GameStateSystem {
  private readonly state: GameState;

  constructor() {
    this.state = {
      coins: 100,
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

  addCropToInventory(cropId: CropId, amount: number): void {
    this.state.cropInventory[cropId] += amount;
  }

  addFarmXp(amount: number): void {
    this.state.farmXp += amount;
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
