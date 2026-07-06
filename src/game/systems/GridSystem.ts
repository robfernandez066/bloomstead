import Phaser from 'phaser';
import type { GridPosition, GridSystemConfig } from '../models/GridTypes';
import type { PlotState } from '../models/PlotTypes';
import { createDiamondPoints, gridToIso } from '../utils/isometric';

const UNLOCKED_FILL = 0x86b85f;
const UNLOCKED_STROKE = 0x496f38;
const PLANTED_FILL = 0x789e4e;
const LOCKED_FILL = 0x66746a;
const LOCKED_STROKE = 0x3f4842;
const HOVER_FILL = 0xa8d87d;
const SPROUT_FILL = 0x315f35;
const READY_FILL = 0xffd65f;

interface GridSystemHandlers {
  onPlotPressed?: (plot: PlotState) => void;
  onPlotDraggedOver?: (plot: PlotState) => void;
}

interface PlotRenderObjects {
  tile: Phaser.GameObjects.Polygon;
  marker: Phaser.GameObjects.Ellipse;
}

export class GridSystem {
  private readonly scene: Phaser.Scene;
  private readonly config: GridSystemConfig;
  private readonly plots: PlotState[];
  private readonly handlers: GridSystemHandlers;
  private readonly renderObjects = new Map<string, PlotRenderObjects>();

  constructor(
    scene: Phaser.Scene,
    config: GridSystemConfig,
    plots: PlotState[],
    handlers: GridSystemHandlers = {}
  ) {
    this.scene = scene;
    this.config = config;
    this.plots = plots;
    this.handlers = handlers;
  }

  render(): void {
    for (const plot of this.plots) {
      this.renderPlot(plot);
    }
  }

  refreshPlotVisuals(): void {
    for (const plot of this.plots) {
      this.refreshPlotVisual(plot);
    }
  }

  getPlotScreenPosition(plot: PlotState): Phaser.Math.Vector2 {
    const { tileWidth, tileHeight, originX, originY } = this.config;
    const position = gridToIso(
      { row: plot.row, column: plot.column },
      tileWidth,
      tileHeight,
      originX,
      originY
    );

    return new Phaser.Math.Vector2(position.x, position.y);
  }

  private renderPlot(plot: PlotState): void {
    const { tileWidth, tileHeight, originX, originY } = this.config;
    const position = { row: plot.row, column: plot.column };
    const screenPosition = gridToIso(position, tileWidth, tileHeight, originX, originY);
    const diamondPoints = createDiamondPoints(tileWidth, tileHeight);
    const strokeColor = plot.unlocked ? UNLOCKED_STROKE : LOCKED_STROKE;

    const diamond = this.scene.add
      .polygon(screenPosition.x, screenPosition.y, diamondPoints, this.getPlotFill(plot))
      .setStrokeStyle(2, strokeColor)
      .setDepth(plot.row + plot.column)
      .setInteractive(
        new Phaser.Geom.Polygon(diamondPoints),
        Phaser.Geom.Polygon.Contains
      );

    const marker = this.scene.add
      .ellipse(screenPosition.x, screenPosition.y - 5, 10, 14, SPROUT_FILL)
      .setDepth(plot.row + plot.column + 0.2)
      .setVisible(false);

    this.renderObjects.set(this.getPlotKey(plot), { tile: diamond, marker });
    this.refreshPlotVisual(plot);

    diamond.on('pointerdown', () => {
      this.logTilePosition(position);
      this.handlers.onPlotPressed?.(plot);
    });

    diamond.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.handlers.onPlotDraggedOver?.(plot);
      }

      if (plot.unlocked) {
        diamond.setFillStyle(HOVER_FILL);
      }
    });

    diamond.on('pointerout', () => {
      diamond.setFillStyle(this.getPlotFill(plot));
    });
  }

  private refreshPlotVisual(plot: PlotState): void {
    const objects = this.renderObjects.get(this.getPlotKey(plot));

    if (objects === undefined) {
      return;
    }

    objects.tile.setFillStyle(this.getPlotFill(plot));
    objects.tile.setStrokeStyle(2, plot.unlocked ? UNLOCKED_STROKE : LOCKED_STROKE);

    if (plot.plantedCropId === null) {
      objects.marker.setVisible(false);
      return;
    }

    objects.marker
      .setVisible(true)
      .setFillStyle(plot.ready ? READY_FILL : SPROUT_FILL)
      .setSize(plot.ready ? 18 : 10, plot.ready ? 22 : 14);
  }

  private getPlotFill(plot: PlotState): number {
    if (!plot.unlocked) {
      return LOCKED_FILL;
    }

    if (plot.plantedCropId !== null) {
      return PLANTED_FILL;
    }

    return UNLOCKED_FILL;
  }

  private getPlotKey(plot: PlotState): string {
    return `${plot.row}:${plot.column}`;
  }

  private logTilePosition(position: GridPosition): void {
    console.log(`Tile tapped: row ${position.row}, column ${position.column}`);
  }
}
