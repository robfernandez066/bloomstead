import type { CropId } from './CropTypes';

export interface PlotState {
  row: number;
  column: number;
  unlocked: boolean;
  plantedCropId: CropId | null;
  plantedAt: number | null;
  growDurationMs: number | null;
  ready: boolean;
}
