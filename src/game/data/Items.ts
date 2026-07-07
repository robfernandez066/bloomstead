import { CROPS } from './Crops';
import { PROCESSED_GOODS } from './ProcessedGoods';
import type { CropId } from '../models/CropTypes';
import type { ItemId, ProcessedGoodId } from '../models/ItemTypes';

export function isCropId(itemId: ItemId): itemId is CropId {
  return itemId in CROPS;
}

export function isProcessedGoodId(itemId: ItemId): itemId is ProcessedGoodId {
  return itemId in PROCESSED_GOODS;
}

export function getItemName(itemId: ItemId): string {
  if (isCropId(itemId)) {
    return CROPS[itemId].name;
  }

  return PROCESSED_GOODS[itemId].name;
}
