import { CROPS } from '../data/Crops';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { GameStateSystem } from './GameStateSystem';

export interface CropSellResult {
  crop: CropDefinition;
  coinValue: number;
}

export class CropSellingSystem {
  private readonly gameState: GameStateSystem;

  constructor(gameState: GameStateSystem) {
    this.gameState = gameState;
  }

  canSell(cropId: CropId): boolean {
    return this.gameState.getState().cropInventory[cropId] > 0;
  }

  sellCrop(cropId: CropId): CropSellResult | null {
    const crop = CROPS[cropId];

    if (!this.canSell(crop.id)) {
      return null;
    }

    if (!this.gameState.removeCropInventory({ [crop.id]: 1 })) {
      return null;
    }

    this.gameState.addCoins(crop.sellValue);
    return {
      crop,
      coinValue: crop.sellValue
    };
  }
}
