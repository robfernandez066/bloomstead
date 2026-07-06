import type { CropDefinition, CropId } from '../models/CropTypes';

export const CROPS: Record<CropId, CropDefinition> = {
  sunwheat: {
    id: 'sunwheat',
    name: 'Sunwheat',
    unlockLevel: 1,
    growTimeSeconds: 10,
    seedCost: 2,
    sellValue: 4,
    xp: 1
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    unlockLevel: 2,
    growTimeSeconds: 30,
    seedCost: 5,
    sellValue: 12,
    xp: 3
  },
  glowberry: {
    id: 'glowberry',
    name: 'Glowberry',
    unlockLevel: 3,
    growTimeSeconds: 90,
    seedCost: 12,
    sellValue: 32,
    xp: 8
  }
};

export const MVP_CROPS = Object.values(CROPS);
