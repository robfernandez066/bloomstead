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
