import type { GridPosition, IsometricPoint } from '../models/GridTypes';

export function gridToIso(
  position: GridPosition,
  tileWidth: number,
  tileHeight: number,
  originX: number,
  originY: number
): IsometricPoint {
  return {
    x: originX + (position.column - position.row) * (tileWidth / 2),
    y: originY + (position.column + position.row) * (tileHeight / 2)
  };
}

export function createDiamondPoints(tileWidth: number, tileHeight: number): number[] {
  const halfWidth = tileWidth / 2;
  const halfHeight = tileHeight / 2;

  return [0, -halfHeight, halfWidth, 0, 0, halfHeight, -halfWidth, 0];
}
