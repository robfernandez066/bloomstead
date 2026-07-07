import type { ItemId } from './ItemTypes';

export type OrderId =
  | 'sunwheat-sack'
  | 'carrot-bundle'
  | 'village-breakfast'
  | 'glowberry-treats'
  | 'market-starter-crate'
  | 'bakers-flour';

export type OrderRequirements = Partial<Record<ItemId, number>>;

export interface OrderDefinition {
  id: OrderId;
  name: string;
  requirements: OrderRequirements;
  coinReward: number;
  xpReward: number;
  minFarmLevel?: number;
}
