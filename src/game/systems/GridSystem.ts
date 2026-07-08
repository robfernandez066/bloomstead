import Phaser from 'phaser';
import type { CropId } from '../models/CropTypes';
import type { GridPosition, GridSystemConfig } from '../models/GridTypes';
import type { PlotState } from '../models/PlotTypes';
import {
  createDiamondPoints,
  createTopLeftDiamondPoints,
  getCenteredIsometricPlotContainerPosition,
  gridToIso
} from '../utils/isometric';

const UNLOCKED_FILL = 0x9b7449;
const UNLOCKED_STROKE = 0x6f5734;
const PLANTED_FILL = 0x6f8f4a;
const READY_FILL = 0xaedb75;
const LOCKED_FILL = 0x66746a;
const LOCKED_STROKE = 0x3f4842;
const HOVER_FILL = 0xb48756;
const HARVEST_PARTICLE_FILL = 0xffd65f;
const LEAF_FILL = 0x67a845;
const DARK_LEAF_FILL = 0x315f35;
const WHEAT_FILL = 0xffcf56;
const WHEAT_STEM_FILL = 0x8c6b2f;
const CARROT_FILL = 0xe87832;
const CARROT_SHADOW_FILL = 0xb7532b;
const GLOWBERRY_FILL = 0x8c58d8;
const GLOWBERRY_LIGHT_FILL = 0xd8b7ff;
const DEBUG_ANCHOR_FILL = 0xff3355;
const DEBUG_LABEL_COLOR = '#1b2b1b';
const CROP_VISUAL_LOCAL_Y = 3;

interface GridSystemHandlers {
  onPlotPressed?: (plot: PlotState) => void;
  onPlotDraggedOver?: (plot: PlotState) => void;
}

interface CropStageVisuals {
  growing: Phaser.GameObjects.Container;
  ready: Phaser.GameObjects.Container;
}

interface PlotRenderObjects {
  tile: Phaser.GameObjects.Polygon;
  cropVisual: Phaser.GameObjects.Container;
  cropVisuals: Record<CropId, CropStageVisuals>;
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

  getVisiblePlotScreenBounds(padding = 6): Phaser.Geom.Rectangle {
    const visiblePlots = this.plots.filter((plot) => plot.unlocked);

    if (visiblePlots.length === 0) {
      return new Phaser.Geom.Rectangle(this.config.area.x, this.config.area.y, 0, 0);
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const plot of visiblePlots) {
      const center = this.getPlotScreenPosition(plot);

      minX = Math.min(minX, center.x - this.config.tileWidth / 2);
      maxX = Math.max(maxX, center.x + this.config.tileWidth / 2);
      minY = Math.min(minY, center.y - this.config.tileHeight / 2);
      maxY = Math.max(maxY, center.y + this.config.tileHeight / 2);
    }

    return new Phaser.Geom.Rectangle(
      minX - padding,
      minY - padding,
      maxX - minX + padding * 2,
      maxY - minY + padding * 2
    );
  }

  playPlantEffect(plot: PlotState): void {
    const objects = this.renderObjects.get(this.getPlotKey(plot));

    if (objects === undefined) {
      return;
    }

    objects.cropVisual.setScale(0.72);
    this.scene.tweens.add({
      targets: objects.cropVisual,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }

  playReadyEffect(plot: PlotState): void {
    const objects = this.renderObjects.get(this.getPlotKey(plot));

    if (objects === undefined) {
      return;
    }

    const anchor = this.getPlotScreenPosition(plot);
    const pulse = this.scene.add
      .ellipse(anchor.x, anchor.y, this.config.tileWidth * 0.42, this.config.tileHeight * 0.5, 0xffe27a, 0.45)
      .setDepth(90);

    this.scene.tweens.add({
      targets: pulse,
      scale: 1.8,
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => pulse.destroy()
    });
  }

  playHarvestEffect(plot: PlotState): void {
    const anchor = this.getPlotScreenPosition(plot);

    for (let index = 0; index < 5; index += 1) {
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(210, 330));
      const distance = Phaser.Math.Between(8, 16);
      const particle = this.scene.add.circle(anchor.x, anchor.y, 2, HARVEST_PARTICLE_FILL, 0.9).setDepth(100);

      this.scene.tweens.add({
        targets: particle,
        x: anchor.x + Math.cos(angle) * distance,
        y: anchor.y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 360,
        ease: 'Sine.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  playPlotUnlockEffect(plot: PlotState): void {
    const objects = this.renderObjects.get(this.getPlotKey(plot));

    if (objects === undefined) {
      return;
    }

    objects.tile.setScale(0.82);
    this.scene.tweens.add({
      targets: objects.tile,
      scale: 1,
      duration: 240,
      ease: 'Back.easeOut'
    });
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

    const { cropVisual, cropVisuals } = this.createCropVisual();

    this.tileLayer.add(diamond);
    this.markerLayer.add(cropVisual);

    if (this.config.debugAnchors) {
      this.renderDebugAnchor(plot);
    }

    this.renderObjects.set(this.getPlotKey(plot), {
      tile: diamond,
      cropVisual,
      cropVisuals
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
    this.hideCropStageVisuals(objects.cropVisuals);
    objects.cropVisuals[plot.plantedCropId].growing.setVisible(!plot.ready);
    objects.cropVisuals[plot.plantedCropId].ready.setVisible(plot.ready);
  }

  private getPlotFill(plot: PlotState): number {
    if (!plot.unlocked) {
      return LOCKED_FILL;
    }

    if (plot.plantedCropId !== null) {
      if (plot.ready) {
        return READY_FILL;
      }

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

  private createCropVisual(): {
    cropVisual: Phaser.GameObjects.Container;
    cropVisuals: Record<CropId, CropStageVisuals>;
  } {
    const cropVisuals: Record<CropId, CropStageVisuals> = {
      sunwheat: {
        growing: this.createSunwheatGrowingVisual().setY(CROP_VISUAL_LOCAL_Y),
        ready: this.createSunwheatReadyVisual().setY(CROP_VISUAL_LOCAL_Y)
      },
      carrot: {
        growing: this.createCarrotGrowingVisual().setY(CROP_VISUAL_LOCAL_Y),
        ready: this.createCarrotReadyVisual().setY(CROP_VISUAL_LOCAL_Y)
      },
      glowberry: {
        growing: this.createGlowberryGrowingVisual().setY(CROP_VISUAL_LOCAL_Y),
        ready: this.createGlowberryReadyVisual().setY(CROP_VISUAL_LOCAL_Y)
      }
    };
    const cropVisual = this.scene.add.container(0, 0).setVisible(false);

    Object.values(cropVisuals).forEach(({ growing, ready }) => {
      cropVisual.add([growing, ready]);
      growing.setVisible(false);
      ready.setVisible(false);
    });

    return { cropVisual, cropVisuals };
  }

  private hideCropStageVisuals(cropVisuals: Record<CropId, CropStageVisuals>): void {
    Object.values(cropVisuals).forEach(({ growing, ready }) => {
      growing.setVisible(false);
      ready.setVisible(false);
    });
  }

  private createSunwheatGrowingVisual(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const stalkA = this.scene.add.rectangle(-3, -3, 1.5, 8, WHEAT_STEM_FILL).setAngle(-10);
    const stalkB = this.scene.add.rectangle(1, -4, 1.5, 10, WHEAT_STEM_FILL);
    const grainA = this.scene.add.ellipse(-3, -8, 3, 5, WHEAT_FILL).setAngle(-18);
    const grainB = this.scene.add.ellipse(1, -10, 3, 5, WHEAT_FILL);

    return container.add([stalkA, stalkB, grainA, grainB]);
  }

  private createSunwheatReadyVisual(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const stalks = [
      this.scene.add.rectangle(-5, -3, 1.5, 11, WHEAT_STEM_FILL).setAngle(-16),
      this.scene.add.rectangle(0, -4, 1.5, 13, WHEAT_STEM_FILL),
      this.scene.add.rectangle(5, -3, 1.5, 11, WHEAT_STEM_FILL).setAngle(16)
    ];
    const grains = [
      this.scene.add.ellipse(-6, -10, 4, 6, WHEAT_FILL).setAngle(-18),
      this.scene.add.ellipse(-2, -12, 4, 7, WHEAT_FILL).setAngle(-8),
      this.scene.add.ellipse(2, -12, 4, 7, WHEAT_FILL).setAngle(8),
      this.scene.add.ellipse(6, -10, 4, 6, WHEAT_FILL).setAngle(18)
    ];

    return container.add([...stalks, ...grains]);
  }

  private createCarrotGrowingVisual(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const carrot = this.scene.add.graphics();

    carrot.fillStyle(DARK_LEAF_FILL, 1);
    carrot.fillTriangle(-5, -1, -2, -8, 0, -1);
    carrot.fillTriangle(-2, -2, 1, -10, 3, -2);
    carrot.fillTriangle(1, -1, 6, -7, 5, 0);
    carrot.fillStyle(CARROT_FILL, 1);
    carrot.fillEllipse(0, 2, 7, 6);
    carrot.lineStyle(1, CARROT_SHADOW_FILL, 0.55);
    carrot.lineBetween(-2, 2, 2, 2);

    return container.add(carrot);
  }

  private createCarrotReadyVisual(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const carrot = this.scene.add.graphics();

    carrot.fillStyle(DARK_LEAF_FILL, 1);
    carrot.fillTriangle(-7, -1, -3, -10, 0, -1);
    carrot.fillTriangle(-3, -2, 0, -12, 3, -2);
    carrot.fillTriangle(1, -1, 7, -9, 6, 0);
    carrot.fillStyle(CARROT_FILL, 1);
    carrot.fillEllipse(0, 3, 10, 8);
    carrot.lineStyle(1, CARROT_SHADOW_FILL, 0.7);
    carrot.lineBetween(-3, 2, 3, 2);
    carrot.lineBetween(-2, 5, 2, 5);

    return container.add(carrot);
  }

  private createGlowberryGrowingVisual(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const base = this.scene.add.ellipse(0, -2, 12, 7, DARK_LEAF_FILL);
    const leafA = this.scene.add.ellipse(-4, -5, 6, 3, LEAF_FILL).setAngle(-25);
    const leafB = this.scene.add.ellipse(4, -5, 6, 3, LEAF_FILL).setAngle(25);
    const berry = this.scene.add.circle(0, -7, 2.4, GLOWBERRY_FILL);

    return container.add([base, leafA, leafB, berry]);
  }

  private createGlowberryReadyVisual(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const base = this.scene.add.ellipse(0, -2, 14, 8, DARK_LEAF_FILL);
    const leafA = this.scene.add.ellipse(-5, -6, 7, 3, LEAF_FILL).setAngle(-25);
    const leafB = this.scene.add.ellipse(5, -6, 7, 3, LEAF_FILL).setAngle(25);
    const berryA = this.scene.add.circle(-4, -8, 3, GLOWBERRY_FILL);
    const berryB = this.scene.add.circle(1, -10, 3.2, GLOWBERRY_FILL);
    const berryC = this.scene.add.circle(5, -6, 2.8, GLOWBERRY_FILL);
    const glint = this.scene.add.circle(0, -11, 1, GLOWBERRY_LIGHT_FILL);

    return container.add([base, leafA, leafB, berryA, berryB, berryC, glint]);
  }

  private logTilePosition(position: GridPosition): void {
    console.log(`Tile tapped: row ${position.row}, column ${position.column}`);
  }
}
