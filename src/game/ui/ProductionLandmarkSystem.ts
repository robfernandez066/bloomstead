import Phaser from 'phaser';
import { PRODUCTION_RECIPES } from '../data/ProductionRecipes';
import type {
  ProductionBuildingId,
  ProductionRecipeDefinition,
  ProductionRecipeId
} from '../models/ProductionTypes';
import type { ProductionSystem } from '../systems/ProductionSystem';
import { createItemIcon } from './ItemIcon';

const LANDMARK_DEPTH = 18;
const HIT_DEPTH = LANDMARK_DEPTH + 3;
const READY_DEPTH = LANDMARK_DEPTH + 4;
const HIGHLIGHT_FILL = 0xffe27a;
const SIGN_FILL = 0xf7edc7;
const SIGN_STROKE = 0x6f5734;
const SIGN_TEXT = '#2f3b26';
const LOCKED_WOOD = 0x8f8067;
const LOCKED_DARK = 0x655d50;
const LOCKED_LIGHT = 0xb8aa8d;

interface LandmarkBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductionLandmarkConfig {
  landmarks: Record<ProductionBuildingId, LandmarkBounds>;
  onOpen: (recipeId: ProductionRecipeId) => void;
  onLockedTap: (recipeId: ProductionRecipeId) => void;
  shouldHighlightLandmark?: (recipeId: ProductionRecipeId) => boolean;
  shouldHighlightReady?: (recipeId: ProductionRecipeId) => boolean;
}

export class ProductionLandmarkSystem {
  private readonly scene: Phaser.Scene;
  private readonly productionSystem: ProductionSystem;
  private config?: ProductionLandmarkConfig;
  private renderSignature = '';
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly animatedTargets: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, productionSystem: ProductionSystem) {
    this.scene = scene;
    this.productionSystem = productionSystem;
  }

  render(config: ProductionLandmarkConfig): void {
    this.config = config;
    this.refresh(true);
  }

  refresh(force = false): void {
    if (this.config === undefined) {
      return;
    }

    const signature = this.getRenderSignature();

    if (!force && signature === this.renderSignature) {
      return;
    }

    this.renderSignature = signature;
    this.clearObjects();

    for (const recipe of Object.values(PRODUCTION_RECIPES)) {
      this.renderLandmark(recipe, this.config.landmarks[recipe.buildingId]);
    }
  }

  getLandmarkBounds(recipeId: ProductionRecipeId): Phaser.Geom.Rectangle {
    const recipe = PRODUCTION_RECIPES[recipeId];
    const bounds = this.config?.landmarks[recipe.buildingId];

    if (bounds === undefined) {
      return new Phaser.Geom.Rectangle();
    }

    return new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  getReadyIndicatorBounds(recipeId: ProductionRecipeId): Phaser.Geom.Rectangle | null {
    if (this.productionSystem.getClaimableQuantity(recipeId) <= 0) {
      return null;
    }

    return this.getReadyBounds(PRODUCTION_RECIPES[recipeId]);
  }

  private renderLandmark(
    recipe: ProductionRecipeDefinition,
    bounds: LandmarkBounds
  ): void {
    const unlocked = this.productionSystem.isRecipeUnlocked(recipe.id);
    const accessible = this.productionSystem.isRecipeAccessible(recipe.id);
    const state = this.productionSystem.getRecipeState(recipe.id);
    const producing = state.status === 'producing';
    const claimableQuantity = this.productionSystem.getClaimableQuantity(recipe.id);
    const highlighted = this.config?.shouldHighlightLandmark?.(recipe.id) === true;
    const centerX = bounds.x + bounds.width / 2;
    const groundY = bounds.y + bounds.height - 12;

    if (highlighted) {
      const highlight = this.scene.add
        .ellipse(centerX, groundY - 24, bounds.width - 2, bounds.height - 2, HIGHLIGHT_FILL, 0.2)
        .setStrokeStyle(3, HIGHLIGHT_FILL, 0.95)
        .setDepth(LANDMARK_DEPTH - 1);

      this.scene.tweens.add({
        targets: highlight,
        alpha: 0.08,
        scale: 1.06,
        duration: 560,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.objects.push(highlight);
      this.animatedTargets.push(highlight);
    }

    const landmark = recipe.buildingId === 'mill'
      ? this.createMill(centerX, groundY, unlocked, producing, recipe)
      : this.createBakery(centerX, groundY, unlocked, producing, recipe);

    landmark.setDepth(LANDMARK_DEPTH);
    this.objects.push(landmark);

    const hitArea = this.scene.add
      .rectangle(bounds.x, bounds.y, bounds.width, bounds.height, 0xffffff, 0.001)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(HIT_DEPTH);

    hitArea.on('pointerdown', () => {
      if (accessible) {
        this.config?.onOpen(recipe.id);
      } else {
        this.config?.onLockedTap(recipe.id);
      }
    });
    this.objects.push(hitArea);

    if (claimableQuantity > 0) {
      this.renderReadyIndicator(recipe, claimableQuantity);
    }
  }

  private createMill(
    x: number,
    groundY: number,
    unlocked: boolean,
    producing: boolean,
    recipe: ProductionRecipeDefinition
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, groundY);
    const shadow = this.scene.add.ellipse(0, 0, 66, 13, 0x355b35, 0.32);

    if (!unlocked) {
      const body = this.scene.add.rectangle(-5, -28, 38, 34, LOCKED_LIGHT, 0.65)
        .setStrokeStyle(2, LOCKED_DARK);
      const roof = this.createRoof(-5, -62, 28, 21, LOCKED_DARK, 0x514b42, 0.82);
      const scaffoldA = this.scene.add.rectangle(-30, -27, 3, 50, LOCKED_WOOD).setAngle(-5);
      const scaffoldB = this.scene.add.rectangle(20, -27, 3, 50, LOCKED_WOOD).setAngle(5);
      const scaffoldBar = this.scene.add.rectangle(-5, -35, 56, 3, LOCKED_WOOD);
      const wheel = this.createMillWheel(25, -22, LOCKED_DARK, false).setAlpha(0.72);
      const lockSign = this.createSign(
        -5,
        -67,
        `${recipe.buildingName} · Level ${recipe.unlockLevel}`,
        true
      );

      return container.add([
        shadow,
        body,
        roof,
        scaffoldA,
        scaffoldB,
        scaffoldBar,
        wheel,
        lockSign
      ]);
    }

    const base = this.scene.add.rectangle(-5, -10, 42, 12, 0x82705c)
      .setStrokeStyle(2, 0x5f5144);
    const body = this.scene.add.rectangle(-5, -30, 42, 34, 0xc79a61)
      .setStrokeStyle(2, 0x6f5734);
    const roof = this.createRoof(-5, -64, 30, 22, 0x7f3f36, 0x5a302c);
    const door = this.scene.add.rectangle(-11, -20, 11, 20, 0x664838)
      .setStrokeStyle(1, 0x3f322c);
    const windowGlow = this.scene.add.rectangle(5, -33, 10, 10, 0xffd87a)
      .setStrokeStyle(2, 0x6f5734);
    const wheel = this.createMillWheel(25, -22, 0x785437, producing);
    const sign = this.createSign(-5, 5, 'Mill', false);

    return container.add([shadow, base, body, roof, door, windowGlow, wheel, sign]);
  }

  private createMillWheel(
    x: number,
    y: number,
    color: number,
    spinning: boolean
  ): Phaser.GameObjects.Container {
    const wheel = this.scene.add.container(x, y);
    const rim = this.scene.add.circle(0, 0, 16, 0x000000, 0)
      .setStrokeStyle(3, color);
    const hub = this.scene.add.circle(0, 0, 3, color);
    const spokes = [0, 45, 90, 135].map((angle) =>
      this.scene.add.rectangle(0, 0, 27, 2, color).setAngle(angle)
    );

    wheel.add([rim, ...spokes, hub]);

    if (spinning) {
      this.scene.tweens.add({
        targets: wheel,
        angle: 360,
        duration: 5200,
        repeat: -1,
        ease: 'Linear'
      });
      this.animatedTargets.push(wheel);
    }

    return wheel;
  }

  private createBakery(
    x: number,
    groundY: number,
    unlocked: boolean,
    producing: boolean,
    recipe: ProductionRecipeDefinition
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, groundY);
    const shadow = this.scene.add.ellipse(0, 0, 68, 13, 0x355b35, 0.32);

    if (!unlocked) {
      const body = this.scene.add.rectangle(0, -28, 44, 34, LOCKED_LIGHT, 0.65)
        .setStrokeStyle(2, LOCKED_DARK);
      const roof = this.createRoof(0, -63, 31, 21, LOCKED_DARK, 0x514b42, 0.82);
      const chimney = this.scene.add.rectangle(14, -52, 8, 26, LOCKED_DARK, 0.78);
      const scaffoldA = this.scene.add.rectangle(-28, -27, 3, 50, LOCKED_WOOD).setAngle(-5);
      const scaffoldB = this.scene.add.rectangle(28, -27, 3, 50, LOCKED_WOOD).setAngle(5);
      const scaffoldBar = this.scene.add.rectangle(0, -35, 60, 3, LOCKED_WOOD);
      const oven = this.scene.add.ellipse(0, -19, 18, 20, 0x5f574c, 0.75);
      const lockSign = this.createSign(
        0,
        -67,
        `${recipe.buildingName} · Level ${recipe.unlockLevel}`,
        true
      );

      return container.add([
        shadow,
        body,
        chimney,
        roof,
        scaffoldA,
        scaffoldB,
        scaffoldBar,
        oven,
        lockSign
      ]);
    }

    const base = this.scene.add.rectangle(0, -10, 48, 12, 0x8b6751)
      .setStrokeStyle(2, 0x664638);
    const body = this.scene.add.rectangle(0, -30, 48, 34, 0xd99a62)
      .setStrokeStyle(2, 0x744c35);
    const chimney = this.scene.add.rectangle(14, -53, 9, 28, 0x8d5542)
      .setStrokeStyle(2, 0x633c32);
    const roof = this.createRoof(0, -65, 32, 23, 0xa94f3f, 0x6f352e);
    const ovenGlow = this.scene.add.ellipse(0, -20, 19, 22, producing ? 0xffbd5b : 0x4d362f)
      .setStrokeStyle(2, 0x5d3a31)
      .setAlpha(producing ? 0.95 : 1);
    const ovenOpening = this.scene.add.rectangle(0, -15, 19, 12, producing ? 0xe06f35 : 0x4d362f);
    const window = this.scene.add.rectangle(-15, -34, 9, 10, 0xffd87a)
      .setStrokeStyle(2, 0x744c35);
    const sign = this.createSign(0, 5, 'Bakery', false);

    if (producing) {
      this.scene.tweens.add({
        targets: [ovenGlow, ovenOpening],
        alpha: 0.62,
        duration: 760,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.animatedTargets.push(ovenGlow, ovenOpening);
      this.addBakerySmoke(container, 14, -69, 0);
      this.addBakerySmoke(container, 18, -73, 620);
    }

    return container.add([shadow, base, body, chimney, roof, ovenGlow, ovenOpening, window, sign]);
  }

  private addBakerySmoke(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    delay: number
  ): void {
    const smoke = this.scene.add.circle(x, y, 4, 0xf2ead7, 0.52);

    container.add(smoke);
    this.scene.tweens.add({
      targets: smoke,
      x: x + 5,
      y: y - 14,
      alpha: 0,
      scale: 1.45,
      duration: 1800,
      delay,
      repeat: -1,
      repeatDelay: 280,
      ease: 'Sine.easeOut'
    });
    this.animatedTargets.push(smoke);
  }

  private createRoof(
    centerX: number,
    apexY: number,
    halfWidth: number,
    height: number,
    fill: number,
    stroke: number,
    alpha = 1
  ): Phaser.GameObjects.Graphics {
    const roof = this.scene.add.graphics();

    roof.fillStyle(fill, alpha);
    roof.fillTriangle(
      centerX - halfWidth,
      apexY + height,
      centerX,
      apexY,
      centerX + halfWidth,
      apexY + height
    );
    roof.lineStyle(2, stroke, alpha);
    roof.strokeTriangle(
      centerX - halfWidth,
      apexY + height,
      centerX,
      apexY,
      centerX + halfWidth,
      apexY + height
    );

    return roof;
  }

  private createSign(
    x: number,
    y: number,
    label: string,
    locked: boolean
  ): Phaser.GameObjects.Container {
    const width = locked ? 72 : label === 'Bakery' ? 54 : 42;
    const container = this.scene.add.container(x, y);
    const panel = this.scene.add.rectangle(0, 0, width, 17, locked ? LOCKED_DARK : SIGN_FILL)
      .setStrokeStyle(2, locked ? LOCKED_WOOD : SIGN_STROKE);
    const text = this.scene.add.text(0, 0, label, {
      color: locked ? '#fff4d0' : SIGN_TEXT,
      fontFamily: 'Arial, sans-serif',
      fontSize: locked ? '9px' : '10px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);

    return container.add([panel, text]);
  }

  private renderReadyIndicator(
    recipe: ProductionRecipeDefinition,
    claimableQuantity: number
  ): void {
    const bounds = this.getReadyBounds(recipe);
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;
    const highlighted = this.config?.shouldHighlightReady?.(recipe.id) === true;
    const bubble = this.scene.add.circle(centerX, centerY, 14, 0xfff8dd)
      .setStrokeStyle(highlighted ? 4 : 3, highlighted ? HIGHLIGHT_FILL : 0x6f5734)
      .setDepth(READY_DEPTH);
    const icon = createItemIcon(
      this.scene,
      recipe.outputItemId,
      centerX,
      centerY,
      16,
      { depth: READY_DEPTH + 1 }
    );
    const quantity = this.scene.add
      .text(centerX + 10, centerY + 7, `${claimableQuantity}`, {
        color: '#fff4d0',
        backgroundColor: '#496d3e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        padding: { x: 3, y: 1 }
      })
      .setOrigin(0.5)
      .setDepth(READY_DEPTH + 2)
      .setResolution(2);
    const hitArea = this.scene.add
      .rectangle(bounds.x, bounds.y, bounds.width, bounds.height, 0xffffff, 0.001)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(READY_DEPTH + 3);

    hitArea.on('pointerdown', () => this.config?.onOpen(recipe.id));
    this.scene.tweens.add({
      targets: [bubble, icon],
      scale: highlighted ? 1.18 : 1.1,
      duration: highlighted ? 420 : 640,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.objects.push(bubble, icon, quantity, hitArea);
    this.animatedTargets.push(bubble, icon);
  }

  private getReadyBounds(recipe: ProductionRecipeDefinition): Phaser.Geom.Rectangle {
    const landmark = this.config?.landmarks[recipe.buildingId];

    if (landmark === undefined) {
      return new Phaser.Geom.Rectangle();
    }

    const x = recipe.buildingId === 'mill'
      ? landmark.x + landmark.width - 27
      : landmark.x - 2;

    return new Phaser.Geom.Rectangle(x, landmark.y - 4, 30, 30);
  }

  private getRenderSignature(): string {
    return Object.values(PRODUCTION_RECIPES).map((recipe) => {
      const state = this.productionSystem.getRecipeState(recipe.id);

      return [
        recipe.id,
        this.productionSystem.isRecipeUnlocked(recipe.id),
        state.status,
        this.productionSystem.getClaimableQuantity(recipe.id),
        this.config?.shouldHighlightLandmark?.(recipe.id) === true,
        this.config?.shouldHighlightReady?.(recipe.id) === true
      ].join(':');
    }).join('|');
  }

  private clearObjects(): void {
    for (const target of this.animatedTargets) {
      this.scene.tweens.killTweensOf(target);
    }

    for (const object of this.objects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }

    this.animatedTargets.length = 0;
    this.objects.length = 0;
  }
}
