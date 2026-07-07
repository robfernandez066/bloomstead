import type { CropId } from './CropTypes';

export type ProcessedGoodId = 'flour' | 'bread';
export type ItemId = CropId | ProcessedGoodId;

export interface ProcessedGoodDefinition {
  id: ProcessedGoodId;
  name: string;
}

export type ProcessedGoodInventory = Record<ProcessedGoodId, number>;
