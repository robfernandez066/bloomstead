import type { CropId } from './CropTypes';

export type OrderId =
  | 'sunwheat-sack'
  | 'carrot-bundle'
  | 'village-breakfast'
  | 'glowberry-treats'
  | 'market-starter-crate';

export type OrderRequirements = Partial<Record<CropId, number>>;

export interface OrderDefinition {
  id: OrderId;
  name: string;
  requirements: OrderRequirements;
  coinReward: number;
  xpReward: number;
}
