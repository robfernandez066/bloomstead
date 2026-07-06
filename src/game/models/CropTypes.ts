export type CropId = 'sunwheat' | 'carrot' | 'glowberry';

export interface CropDefinition {
  id: CropId;
  name: string;
  unlockLevel: number;
  growTimeSeconds: number;
  seedCost: number;
  sellValue: number;
  xp: number;
}
