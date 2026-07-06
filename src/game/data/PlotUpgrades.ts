import type { PlotUpgradeDefinition } from '../models/UpgradeTypes';

export const MVP_PLOT_UPGRADES: PlotUpgradeDefinition[] = [
  {
    id: 'plot-upgrade-1',
    name: 'Field Expansion I',
    plotsToUnlock: 4,
    coinCost: 100
  },
  {
    id: 'plot-upgrade-2',
    name: 'Field Expansion II',
    plotsToUnlock: 4,
    coinCost: 250
  },
  {
    id: 'plot-upgrade-3',
    name: 'Field Expansion III',
    plotsToUnlock: 8,
    coinCost: 500
  }
];
