export interface GridPosition {
  row: number;
  column: number;
}

export interface IsometricPoint {
  x: number;
  y: number;
}

export interface GridBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface GridLayoutArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridSystemConfig {
  tileWidth: number;
  tileHeight: number;
  area: GridLayoutArea;
  markerAnchorOffsetY: number;
  debugAnchors: boolean;
}
