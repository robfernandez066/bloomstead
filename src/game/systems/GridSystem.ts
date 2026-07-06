import Phaser from 'phaser';
import type { GridPosition, GridSystemConfig } from '../models/GridTypes';
import type { PlotState } from '../models/PlotTypes';
import { createDiamondPoints, gridToIso } from '../utils/isometric';

const UNLOCKED_FILL = 0x86b85f;
const UNLOCKED_STROKE = 0x496f38;
const LOCKED_FILL = 0x66746a;
const LOCKED_STROKE = 0x3f4842;
const HOVER_FILL = 0xa8d87d;

export class GridSystem {
  private readonly scene: Phaser.Scene;
  private readonly config: GridSystemConfig;
  private readonly plots: PlotState[];

  constructor(scene: Phaser.Scene, config: GridSystemConfig, plots: PlotState[]) {
    this.scene = scene;
    this.config = config;
    this.plots = plots;
  }

  render(): void {
    for (const plot of this.plots) {
      this.renderPlot(plot);
    }
  }

  private renderPlot(plot: PlotState): void {
    const { tileWidth, tileHeight, originX, originY } = this.config;
    const position = { row: plot.row, column: plot.column };
    const screenPosition = gridToIso(position, tileWidth, tileHeight, originX, originY);
    const diamondPoints = createDiamondPoints(tileWidth, tileHeight);
    const fillColor = plot.unlocked ? UNLOCKED_FILL : LOCKED_FILL;
    const strokeColor = plot.unlocked ? UNLOCKED_STROKE : LOCKED_STROKE;

    const diamond = this.scene.add
      .polygon(screenPosition.x, screenPosition.y, diamondPoints, fillColor)
      .setStrokeStyle(2, strokeColor)
      .setDepth(plot.row + plot.column)
      .setInteractive(
        new Phaser.Geom.Polygon(diamondPoints),
        Phaser.Geom.Polygon.Contains
      );

    diamond.on('pointerdown', () => {
      this.logTilePosition(position);
    });

    diamond.on('pointerover', () => {
      if (plot.unlocked) {
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
