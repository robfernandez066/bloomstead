import type { GridBounds, GridLayoutArea, GridPosition, IsometricPoint } from '../models/GridTypes';

export function gridToIso(
  position: GridPosition,
  tileWidth: number,
  tileHeight: number,
  originX = 0,
  originY = 0
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

export function createTopLeftDiamondPoints(tileWidth: number, tileHeight: number): number[] {
  const halfWidth = tileWidth / 2;
  const halfHeight = tileHeight / 2;

  return [halfWidth, 0, tileWidth, halfHeight, halfWidth, tileHeight, 0, halfHeight];
}

export function getIsometricGridBounds(
  rows: number,
  columns: number,
  tileWidth: number,
  tileHeight: number
): GridBounds {
  const positions: GridPosition[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      positions.push({ row, column });
    }
  }

  return getIsometricPlotBounds(positions, tileWidth, tileHeight);
}

export function getIsometricPlotBounds(
  positions: GridPosition[],
  tileWidth: number,
  tileHeight: number
): GridBounds {
  const diamondPoints = createDiamondPoints(tileWidth, tileHeight);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const position of positions) {
    const point = gridToIso(position, tileWidth, tileHeight);

    for (let index = 0; index < diamondPoints.length; index += 2) {
      const vertexX = point.x + diamondPoints[index];
      const vertexY = point.y + diamondPoints[index + 1];

      minX = Math.min(minX, vertexX);
      maxX = Math.max(maxX, vertexX);
      minY = Math.min(minY, vertexY);
      maxY = Math.max(maxY, vertexY);
    }
  }

  if (positions.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0
    };
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function getCenteredIsometricPlotContainerPosition(
  positions: GridPosition[],
  tileWidth: number,
  tileHeight: number,
  area: GridLayoutArea
): IsometricPoint {
  const bounds = getIsometricPlotBounds(positions, tileWidth, tileHeight);

  return {
    x: area.x + (area.width - bounds.width) / 2 - bounds.minX,
    y: area.y + (area.height - bounds.height) / 2 - bounds.minY
  };
}
