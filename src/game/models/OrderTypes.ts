import type { ItemId } from './ItemTypes';

export type OrderId =
  | 'sunwheat-sack'
  | 'carrot-bundle'
  | 'village-breakfast'
  | 'glowberry-treats'
  | 'market-starter-crate'
  | 'bakers-flour'
  | 'fresh-bread'
  | 'glowberry-toast'
  | 'harvest-lunchbox'
  | 'bakers-basket'
  | 'lanternberry-crate'
  | 'village-feast';

export type OrderRequirements = Partial<Record<ItemId, number>>;

export type OrderSource =
  | 'Farm Stand'
  | 'Baker'
  | 'Village Market'
  | 'Village Cook'
  | 'Lantern Guild';

export interface OrderDefinition {
  id: OrderId;
  name: string;
  source?: OrderSource;
  requirements: OrderRequirements;
  coinReward: number;
  xpReward: number;
  minFarmLevel?: number;
}
