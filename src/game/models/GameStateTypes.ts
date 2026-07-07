import type { CropId } from './CropTypes';
import type { ProcessedGoodInventory } from './ItemTypes';

export type CropInventory = Record<CropId, number>;

export interface GameState {
  coins: number;
  farmXp: number;
  farmLevel: number;
  cropInventory: CropInventory;
  processedGoodInventory: ProcessedGoodInventory;
  selectedSeedId: CropId;
}
