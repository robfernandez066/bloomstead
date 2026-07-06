import type { GridPosition } from '../models/GridTypes';

export const STARTING_UNLOCKED_PLOTS: GridPosition[] = [
  { row: 1, column: 1 },
  { row: 1, column: 2 },
  { row: 1, column: 3 },
  { row: 1, column: 4 },
  { row: 2, column: 1 },
  { row: 2, column: 2 },
  { row: 2, column: 3 },
  { row: 2, column: 4 },
  { row: 3, column: 1 },
  { row: 3, column: 2 },
  { row: 3, column: 3 },
  { row: 3, column: 4 }
];

export const PLOT_UPGRADE_UNLOCK_ORDER: GridPosition[][] = [
  [
    { row: 4, column: 1 },
    { row: 4, column: 2 },
    { row: 4, column: 3 },
    { row: 4, column: 4 }
  ],
  [
    { row: 0, column: 1 },
    { row: 0, column: 2 },
    { row: 0, column: 3 },
    { row: 0, column: 4 }
  ],
  [
    { row: 5, column: 1 },
    { row: 5, column: 2 },
    { row: 5, column: 3 },
    { row: 5, column: 4 }
  ]
];
