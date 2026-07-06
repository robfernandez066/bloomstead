export interface GridPosition {
  row: number;
  column: number;
}

export interface IsometricPoint {
  x: number;
  y: number;
}

export interface GridTile {
  position: GridPosition;
  unlocked: boolean;
}

export interface GridSystemConfig {
  rows: number;
  columns: number;
  unlockedTileCount: number;
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}
