export type UpgradeId = 'plot-upgrade-1' | 'plot-upgrade-2' | 'plot-upgrade-3';

export interface PlotUpgradeDefinition {
  id: UpgradeId;
  name: string;
  plotsToUnlock: number;
  coinCost: number;
}
