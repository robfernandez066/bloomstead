import Phaser from 'phaser';
import type { GridPosition, GridSystemConfig, GridTile } from '../models/GridTypes';
import { createDiamondPoints, gridToIso } from '../utils/isometric';

const UNLOCKED_FILL = 0x86b85f;
const UNLOCKED_STROKE = 0x496f38;
const LOCKED_FILL = 0x66746a;
const LOCKED_STROKE = 0x3f4842;
const HOVER_FILL = 0xa8d87d;

export class GridSystem {
  private readonly scene: Phaser.Scene;
  private readonly config: GridSystemConfig;
  private readonly tiles: GridTile[] = [];

  constructor(scene: Phaser.Scene, config: GridSystemConfig) {
    this.scene = scene;
    this.config = config;
  }

  render(): void {
    this.createTiles();

    for (const tile of this.tiles) {
      this.renderTile(tile);
    }
  }

  private createTiles(): void {
    this.tiles.length = 0;

    for (let row = 0; row < this.config.rows; row += 1) {
      for (let column = 0; column < this.config.columns; column += 1) {
        const tileIndex = row * this.config.columns + column;

        this.tiles.push({
          position: { row, column },
          unlocked: tileIndex < this.config.unlockedTileCount
        });
      }
    }
  }

  private renderTile(tile: GridTile): void {
    const { tileWidth, tileHeight, originX, originY } = this.config;
    const screenPosition = gridToIso(tile.position, tileWidth, tileHeight, originX, originY);
    const diamondPoints = createDiamondPoints(tileWidth, tileHeight);
    const fillColor = tile.unlocked ? UNLOCKED_FILL : LOCKED_FILL;
    const strokeColor = tile.unlocked ? UNLOCKED_STROKE : LOCKED_STROKE;

    const diamond = this.scene.add
      .polygon(screenPosition.x, screenPosition.y, diamondPoints, fillColor)
      .setStrokeStyle(2, strokeColor)
      .setDepth(tile.position.row + tile.position.column)
      .setInteractive(
        new Phaser.Geom.Polygon(diamondPoints),
        Phaser.Geom.Polygon.Contains
      );

    diamond.on('pointerdown', () => {
      this.logTilePosition(tile.position);
    });

    diamond.on('pointerover', () => {
      if (tile.unlocked) {
        diamond.setFillStyle(HOVER_FILL);
      }
    });

    diamond.on('pointerout', () => {
      diamond.setFillStyle(fillColor);
    });
  }

  private logTilePosition(position: GridPosition): void {
    console.log(`Tile tapped: row ${position.row}, column ${position.column}`);
  }
}
