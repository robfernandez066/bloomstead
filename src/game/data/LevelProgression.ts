import { CROPS } from './Crops';
import { MVP_ORDERS } from './Orders';
import { PRODUCTION_RECIPES } from './ProductionRecipes';

export interface LevelThreshold {
  level: number;
  requiredXp: number;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, requiredXp: 0 },
  { level: 2, requiredXp: 10 },
  { level: 3, requiredXp: 30 },
  { level: 4, requiredXp: 75 },
  { level: 5, requiredXp: 150 }
];

export function getFarmLevelForXp(farmXp: number): number {
  return LEVEL_THRESHOLDS.reduce((currentLevel, threshold) => {
    return farmXp >= threshold.requiredXp ? threshold.level : currentLevel;
  }, 1);
}

export function getLevelUnlockSummary(previousLevel: number, currentLevel: number): string[] {
  const summary: string[] = [];

  for (let level = previousLevel + 1; level <= currentLevel; level += 1) {
    const cropNames = Object.values(CROPS)
      .filter((crop) => crop.unlockLevel === level)
      .map((crop) => crop.name);
    const buildingNames = Object.values(PRODUCTION_RECIPES)
      .filter((recipe) => recipe.unlockLevel === level)
      .map((recipe) => recipe.buildingName);
    const orderNames = MVP_ORDERS
      .filter((order) => order.minFarmLevel === level)
      .map((order) => order.name);
    let orderSummary: string[] = [];

    if (orderNames.length > 2) {
      orderSummary = ['New orders'];
    } else if (orderNames.length > 0) {
      orderSummary = orderNames;
    }

    const unlocks = [...cropNames, ...buildingNames, ...orderSummary];

    if (unlocks.length > 0) {
      summary.push(unlocks.join(' • '));
    }
  }

  return summary;
}
