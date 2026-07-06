import Phaser from 'phaser';
import type { GridPosition, GridSystemConfig } from '../models/GridTypes';
import type { PlotState } from '../models/PlotTypes';
import {
  createDiamondPoints,
  createTopLeftDiamondPoints,
  getCenteredIsometricPlotContainerPosition,
  gridToIso
} from '../utils/isometric';

const UNLOCKED_FILL = 0x86b85f;
const UNLOCKED_STROKE = 0x496f38;
const PLANTED_FILL = 0x789e4e;
const LOCKED_FILL = 0x66746a;
const LOCKED_STROKE = 0x3f4842;
const HOVER_FILL = 0xa8d87d;
const SPROUT_FILL = 0x315f35;
const READY_FILL = 0xffd65f;
const SPROUT_STEM_FILL = 0x2f6b37;
const SPROUT_LEAF_FILL = 0x67a845;
const READY_GRAIN_FILL = 0xffcf56;
const READY_STEM_FILL = 0x8c6b2f;
const DEBUG_ANCHOR_FILL = 0xff3355;
const DEBUG_LABEL_COLOR = '#1b2b1b';

interface GridSystemHandlers {
  onPlotPressed?: (plot: PlotState) => void;
  onPlotDraggedOver?: (plot: PlotState) => void;
}

interface PlotRenderObjects {
  tile: Phaser.GameObjects.Polygon;
  cropVisual: Phaser.GameObjects.Container;
  sproutVisual: Phaser.GameObjects.Container;
  readyVisual: Phaser.GameObjects.Container;
}

export class GridSystem {
  private readonly scene: Phaser.Scene;
  private readonly config: GridSystemConfig;
  private readonly plots: PlotState[];
  private readonly handlers: GridSystemHandlers;
  private readonly renderObjects = new Map<string, PlotRenderObjects>();
  private readonly gridContainer: Phaser.GameObjects.Container;
  private readonly tileLayer: Phaser.GameObjects.Container;
  private readonly markerLayer: Phaser.GameObjects.Container;

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
    this.gridContainer = this.createGridContainer();
    this.tileLayer = this.scene.add.container(0, 0);
    this.markerLayer = this.scene.add.container(0, 0);
    this.gridContainer.add([this.tileLayer, this.markerLayer]);
  }

  render(): void {
    for (const plot of this.plots) {
      this.renderPlot(plot);
    }
  }

  refreshPlotVisuals(): void {
    this.recenterVisibleFarmBed();

    for (const plot of this.plots) {
      this.refreshPlotVisual(plot);
    }
  }

  getPlotScreenPosition(plot: PlotState): Phaser.Math.Vector2 {
    const position = this.getLocalTileCenter(plot);

    return new Phaser.Math.Vector2(
      this.gridContainer.x + position.x,
      this.gridContainer.y + position.y
    );
  }

  private renderPlot(plot: PlotState): void {
    const { tileWidth, tileHeight } = this.config;
    const position = { row: plot.row, column: plot.column };
    const localPosition = this.getLocalTileCenter(plot);
    const diamondPoints = createTopLeftDiamondPoints(tileWidth, tileHeight);
    const tileX = localPosition.x - tileWidth / 2;
    const tileY = localPosition.y - tileHeight / 2;
    const strokeColor = plot.unlocked ? UNLOCKED_STROKE : LOCKED_STROKE;

    const diamond = this.scene.add
      .polygon(tileX, tileY, diamondPoints, this.getPlotFill(plot))
      .setOrigin(0, 0)
      .setStrokeStyle(2, strokeColor)
      .setInteractive(
        new Phaser.Geom.Polygon(diamondPoints),
        Phaser.Geom.Polygon.Contains
      );

    const cropVisual = this.createCropVisual();
    const sproutVisual = cropVisual.getByName('sprout') as Phaser.GameObjects.Container;
    const readyVisual = cropVisual.getByName('ready') as Phaser.GameObjects.Container;

    this.tileLayer.add(diamond);
    this.markerLayer.add(cropVisual);

    if (this.config.debugAnchors) {
      this.renderDebugAnchor(plot);
    }

    this.renderObjects.set(this.getPlotKey(plot), {
      tile: diamond,
      cropVisual,
      sproutVisual,
      readyVisual
    });
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
    objects.tile.setVisible(plot.unlocked);

    if (plot.unlocked) {
      objects.tile.setInteractive(
        new Phaser.Geom.Polygon(createTopLeftDiamondPoints(this.config.tileWidth, this.config.tileHeight)),
        Phaser.Geom.Polygon.Contains
      );
    } else {
      objects.tile.disableInteractive();
    }

    const markerPosition = this.getLocalCropAnchor(plot);
    objects.cropVisual
      .setPosition(markerPosition.x, markerPosition.y);

    if (plot.plantedCropId === null || !plot.unlocked) {
      objects.cropVisual.setVisible(false);
      return;
    }

    objects.cropVisual.setVisible(true);
    objects.sproutVisual.setVisible(!plot.ready);
    objects.readyVisual.setVisible(plot.ready);
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

  private getLocalTileCenter(plot: PlotState): Phaser.Math.Vector2 {
    const { tileWidth, tileHeight } = this.config;
    const position = gridToIso({ row: plot.row, column: plot.column }, tileWidth, tileHeight);

    return new Phaser.Math.Vector2(position.x, position.y);
  }

  private getLocalCropAnchor(plot: PlotState): Phaser.Math.Vector2 {
    const tileCenter = this.getLocalTileCenter(plot);

    return new Phaser.Math.Vector2(tileCenter.x, tileCenter.y + this.config.markerAnchorOffsetY);
  }

  private renderDebugAnchor(plot: PlotState): void {
    const anchor = this.getLocalCropAnchor(plot);

    const dot = this.scene.add.circle(anchor.x, anchor.y, 3, DEBUG_ANCHOR_FILL);
    const label = this.scene.add.text(anchor.x + 5, anchor.y - 7, `${plot.row},${plot.column}`, {
      color: DEBUG_LABEL_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold'
    });

    this.markerLayer.add([dot, label]);
  }

  private createGridContainer(): Phaser.GameObjects.Container {
    const position = getCenteredIsometricPlotContainerPosition(
      this.getVisiblePlotPositions(),
      this.config.tileWidth,
      this.config.tileHeight,
      this.config.area
    );

    return this.scene.add.container(position.x, position.y);
  }

  private recenterVisibleFarmBed(): void {
    const position = getCenteredIsometricPlotContainerPosition(
      this.getVisiblePlotPositions(),
      this.config.tileWidth,
      this.config.tileHeight,
      this.config.area
    );

    this.gridContainer.setPosition(position.x, position.y);
  }

  private getVisiblePlotPositions(): GridPosition[] {
    return this.plots
      .filter((plot) => plot.unlocked)
      .map((plot) => ({ row: plot.row, column: plot.column }));
  }

  private createCropVisual(): Phaser.GameObjects.Container {
    const sprout = this.scene.add.container(0, 0).setName('sprout');
    const sproutStem = this.scene.add.rectangle(0, -1, 2, 6, SPROUT_STEM_FILL);
    const leftLeaf = this.scene.add.ellipse(-3, -3, 6, 3, SPROUT_LEAF_FILL).setAngle(-25);
    const rightLeaf = this.scene.add.ellipse(3, -3, 6, 3, SPROUT_LEAF_FILL).setAngle(25);

    sprout.add([sproutStem, leftLeaf, rightLeaf]);

    const ready = this.scene.add.container(0, 0).setName('ready');
    const readyStem = this.scene.add.rectangle(0, -1, 2, 7, READY_STEM_FILL);
    const grainA = this.scene.add.ellipse(-3, -5, 4, 6, READY_GRAIN_FILL).setAngle(-18);
    const grainB = this.scene.add.ellipse(0, -6, 4, 7, READY_FILL);
    const grainC = this.scene.add.ellipse(3, -5, 4, 6, READY_GRAIN_FILL).setAngle(18);

    ready.add([readyStem, grainA, grainB, grainC]);

    return this.scene.add.container(0, 0, [sprout, ready]).setVisible(false);
  }

  private logTilePosition(position: GridPosition): void {
    console.log(`Tile tapped: row ${position.row}, column ${position.column}`);
  }
}
