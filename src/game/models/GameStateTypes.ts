import type { CropId } from './CropTypes';

export type CropInventory = Record<CropId, number>;

export interface GameState {
  coins: number;
  farmXp: number;
  farmLevel: number;
  cropInventory: CropInventory;
  selectedSeedId: CropId;
}
