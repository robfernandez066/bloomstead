import Phaser from 'phaser';
import type { CropId } from '../models/CropTypes';
import type { IsometricPoint } from '../models/GridTypes';
import { getItemName } from '../data/Items';
import type { ItemId } from '../models/ItemTypes';
import { createItemIcon } from './ItemIcon';

const FLOAT_TEXT_COLOR = '#fff7cc';
const FLOAT_TEXT_STROKE = '#3f512e';
const POP_FILL = 0xffe27a;
const HARVEST_FLY_WINDOW_MS = 320;
const MAX_HARVEST_FLY_EFFECTS_PER_WINDOW = 4;
const HARVEST_AGGREGATE_FADE_DELAY_MS = 620;
const LEVEL_UP_OVERLAY_DEPTH = 200;
const LEVEL_UP_PANEL_DEPTH = LEVEL_UP_OVERLAY_DEPTH + 1;
const LEVEL_UP_PANEL_FILL = 0xf7edc7;
const LEVEL_UP_PANEL_STROKE = 0x496d3e;
const LEVEL_UP_HEADER_FILL = 0x294f32;
const LEVEL_UP_SHADOW_FILL = 0x1c2e22;
const LEVEL_UP_PANEL_MARGIN = 18;
const LEVEL_UP_HEADER_HEIGHT = 42;
const LEVEL_UP_LABEL_TOP_PADDING = 7;
const LEVEL_UP_LABEL_TO_SUMMARY_GAP = 8;
const LEVEL_UP_SUMMARY_TO_BUTTON_GAP = 16;
const LEVEL_UP_BOTTOM_PADDING = 16;
const CROP_FEEDBACK_FILL: Record<CropId, number> = {
  sunwheat: 0xffd65f,
  carrot: 0xf28a3b,
  glowberry: 0xb86cff
};

export class FeedbackSystem {
  private readonly scene: Phaser.Scene;
  private activeLevelUpFeedback?: Phaser.GameObjects.Container;
  private activeLevelUpOverlay?: Phaser.GameObjects.Rectangle;
  private harvestFlyWindowStartMs = 0;
  private harvestFlyEffectsInWindow = 0;
  private aggregateHarvestText?: Phaser.GameObjects.Text;
  private aggregateHarvestFadeEvent?: Phaser.Time.TimerEvent;
  private aggregateHarvestFadeTween?: Phaser.Tweens.Tween;
  private readonly aggregateHarvestCounts = new Map<string, { cropName: string; count: number }>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showHarvestFeedback(position: IsometricPoint, cropName: string, showText = true): void {
    if (showText) {
      this.showHarvestText(position, cropName);
    }

    this.showPop(position.x, position.y - 8, POP_FILL);
  }

  showHarvestText(position: IsometricPoint, cropName: string): void {
    this.showFloatingText(`+1 ${cropName}`, position.x, position.y - 34, 800, 28);
  }

  showAggregateHarvestFeedback(cropId: CropId, cropName: string, x: number, y: number): void {
    const existingCount = this.aggregateHarvestCounts.get(cropId)?.count ?? 0;

    this.aggregateHarvestCounts.set(cropId, {
      cropName,
      count: existingCount + 1
    });

    if (this.aggregateHarvestText === undefined || !this.aggregateHarvestText.active) {
      this.aggregateHarvestText = this.scene.add
        .text(x, y, '', {
          color: FLOAT_TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          stroke: FLOAT_TEXT_STROKE,
          strokeThickness: 4,
          align: 'center',
          wordWrap: { width: 210 }
        })
        .setOrigin(0.5)
        .setDepth(122);
    }

    this.aggregateHarvestFadeTween?.stop();
    this.aggregateHarvestFadeTween = undefined;

    this.aggregateHarvestText
      .setText(this.formatAggregateHarvestText())
      .setPosition(x, y)
      .setAlpha(1)
      .setScale(1);

    this.aggregateHarvestFadeEvent?.remove(false);
    this.aggregateHarvestFadeEvent = this.scene.time.delayedCall(
      HARVEST_AGGREGATE_FADE_DELAY_MS,
      () => this.fadeAggregateHarvestText()
    );
  }

  showHarvestToInventory(
    source: IsometricPoint,
    target: IsometricPoint,
    cropId: CropId
  ): void {
    const now = this.scene.time.now;

    if (now - this.harvestFlyWindowStartMs > HARVEST_FLY_WINDOW_MS) {
      this.harvestFlyWindowStartMs = now;
      this.harvestFlyEffectsInWindow = 0;
    }

    if (this.harvestFlyEffectsInWindow >= MAX_HARVEST_FLY_EFFECTS_PER_WINDOW) {
      return;
    }

    const delay = this.harvestFlyEffectsInWindow * 45;
    this.harvestFlyEffectsInWindow += 1;

    const cropDot = this.scene.add
      .ellipse(source.x, source.y - 10, 11, 8, CROP_FEEDBACK_FILL[cropId], 1)
      .setDepth(121);

    this.scene.tweens.add({
      targets: cropDot,
      x: target.x,
      y: target.y,
      scale: 0.78,
      alpha: 0,
      duration: 590,
      delay,
      ease: 'Sine.easeInOut',
      onComplete: () => cropDot.destroy()
    });
  }

  showPlantingFeedback(position: IsometricPoint, seedCost: number): void {
    this.showFloatingText(`-${seedCost}c`, position.x, position.y - 24, 620, 18, '#fff0a8');
  }

  showInsufficientCoins(position: IsometricPoint, seedCost: number): void {
    this.showFloatingText(
      `Need ${seedCost} coins`,
      position.x,
      position.y - 24,
      900,
      20,
      '#fff0a8'
    );
  }

  showCropSold(x: number, y: number, cropName: string, coins: number): void {
    this.showFloatingText(`Sold ${cropName} +${coins}c`, x, y, 760, 22, '#fff4a8');
  }

  showProductionStarted(
    source: IsometricPoint,
    target: IsometricPoint,
    buildingName: string,
    inputItemId: ItemId
  ): void {
    this.showFloatingText(`${buildingName} Started`, target.x, target.y - 12, 720, 20, '#fff4a8', 142);
    this.showItemFlyEffect(inputItemId, source, target, 16, 520, 142);
    this.showPop(source.x, source.y, 0xfff0a8, 141);
  }

  showProductionReady(x: number, y: number, itemId: ItemId): void {
    this.showFloatingText(`${getItemName(itemId)} Ready!`, x, y, 850, 22, '#fff4a8');
    this.showPop(x, y + 8, POP_FILL);
  }

  showProductionCollected(
    source: IsometricPoint,
    target: IsometricPoint,
    itemId: ItemId,
    itemName: string,
    amount: number
  ): void {
    this.showFloatingText(`+${amount} ${itemName}`, target.x, target.y - 12, 900, 24, '#fff4a8', 142);
    this.showItemFlyEffect(itemId, source, target, 18, 600, 142);
    this.showPop(source.x, source.y, POP_FILL, 141);
  }

  showOrderRewards(x: number, y: number, coins: number, xp: number): void {
    this.showFloatingText(`+${coins}c  +${xp} XP`, x, y, 900, 24, '#fff4a8');
    this.showRewardBurst(x, y + 8);
  }

  showOrderRewardFlyEffects(
    sourceX: number,
    sourceY: number,
    coinTargetX: number,
    coinTargetY: number,
    xpTargetX: number,
    xpTargetY: number
  ): void {
    for (let index = 0; index < 5; index += 1) {
      this.showFlyCircle({
        sourceX: sourceX + Phaser.Math.Between(-28, 28),
        sourceY: sourceY + Phaser.Math.Between(-8, 12),
        targetX: coinTargetX,
        targetY: coinTargetY,
        fill: POP_FILL,
        radius: 4,
        delay: index * 46,
        duration: 560
      });
    }

    for (let index = 0; index < 3; index += 1) {
      this.showFlyCircle({
        sourceX: sourceX + Phaser.Math.Between(-20, 20),
        sourceY: sourceY + Phaser.Math.Between(-8, 12),
        targetX: xpTargetX,
        targetY: xpTargetY,
        fill: 0x9ee8ff,
        radius: 3.8,
        delay: 90 + index * 58,
        duration: 600
      });
    }
  }

  showTutorialCompletionReward(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    coins: number
  ): void {
    this.showFloatingText(`+${coins} coins`, sourceX, sourceY - 20, 1400, 36, '#fff4a8');
    this.showFloatingText(`+${coins} coins`, targetX + 58, targetY + 18, 1600, 28, '#fff4a8');

    const glow = this.scene.add
      .ellipse(sourceX, sourceY, 92, 34, POP_FILL, 0.32)
      .setDepth(118);

    this.scene.tweens.add({
      targets: glow,
      scale: 1.35,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => glow.destroy()
    });

    for (let index = 0; index < 7; index += 1) {
      const coin = this.scene.add.circle(sourceX, sourceY, 4, POP_FILL, 1).setDepth(121);
      const delay = index * 34;
      const offsetX = Phaser.Math.Between(-28, 28);
      const offsetY = Phaser.Math.Between(-12, 10);

      this.scene.tweens.add({
        targets: coin,
        x: sourceX + offsetX,
        y: sourceY + offsetY,
        scale: 1.45,
        duration: 120,
        ease: 'Sine.easeOut',
        delay,
        onComplete: () => {
          this.scene.tweens.add({
            targets: coin,
            x: targetX,
            y: targetY,
            scale: 0.72,
            alpha: 0,
            duration: 540,
            ease: 'Sine.easeIn',
            onComplete: () => coin.destroy()
          });
        }
      });
    }
  }

  showLevelUp(
    level: number,
    unlockSummary: string[],
    x: number,
    y: number,
    onAcknowledge: () => void
  ): void {
    this.clearLevelUpFeedback();

    const panelWidth = Math.min(354, this.scene.scale.width - 36);
    const panelX = x - panelWidth / 2;
    const unlockMessage = unlockSummary.length > 0
      ? unlockSummary.join('\n')
      : 'New farm opportunities are ready.';
    const unlockText = this.scene.add
      .text(x, 0, unlockMessage, {
        color: '#2f3b26',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: panelWidth - 36 }
      })
      .setOrigin(0.5, 0);
    const summaryLabel = this.scene.add
      .text(x, 0, 'UNLOCKED', {
        color: '#496d3e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        letterSpacing: 1
      })
      .setOrigin(0.5, 0);
    const continueWidth = 112;
    const continueHeight = 36;
    const panelHeight =
      LEVEL_UP_HEADER_HEIGHT +
      LEVEL_UP_LABEL_TOP_PADDING +
      summaryLabel.height +
      LEVEL_UP_LABEL_TO_SUMMARY_GAP +
      unlockText.height +
      LEVEL_UP_SUMMARY_TO_BUTTON_GAP +
      continueHeight +
      LEVEL_UP_BOTTOM_PADDING;
    const panelY = Phaser.Math.Clamp(
      y - panelHeight / 2,
      LEVEL_UP_PANEL_MARGIN,
      this.scene.scale.height - panelHeight - LEVEL_UP_PANEL_MARGIN
    );
    const summaryLabelY = panelY + LEVEL_UP_HEADER_HEIGHT + LEVEL_UP_LABEL_TOP_PADDING;
    const summaryY = summaryLabelY + summaryLabel.height + LEVEL_UP_LABEL_TO_SUMMARY_GAP;
    const continueX = x - continueWidth / 2;
    const continueY = summaryY + unlockText.height + LEVEL_UP_SUMMARY_TO_BUTTON_GAP;

    unlockText.setPosition(x, summaryY);
    summaryLabel.setPosition(x, summaryLabelY);

    const overlay = this.scene.add
      .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x17251b, 0.48)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(LEVEL_UP_OVERLAY_DEPTH);
    const shadow = this.scene.add
      .rectangle(panelX + 4, panelY + 5, panelWidth, panelHeight, LEVEL_UP_SHADOW_FILL, 0.36)
      .setOrigin(0, 0);
    const panel = this.scene.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, LEVEL_UP_PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(4, LEVEL_UP_PANEL_STROKE);
    const header = this.scene.add
      .rectangle(panelX, panelY, panelWidth, LEVEL_UP_HEADER_HEIGHT, LEVEL_UP_HEADER_FILL)
      .setOrigin(0, 0);
    const levelText = this.scene.add
      .text(x, panelY + 10, `Level ${level}!`, {
        color: '#fff4a8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        stroke: '#193021',
        strokeThickness: 3
      })
      .setOrigin(0.5, 0);
    const continueButton = this.scene.add
      .rectangle(continueX, continueY, continueWidth, continueHeight, LEVEL_UP_PANEL_STROKE)
      .setOrigin(0, 0)
      .setStrokeStyle(2, LEVEL_UP_HEADER_FILL)
      .setInteractive({ useHandCursor: true });
    const continueText = this.scene.add
      .text(x, continueY + continueHeight / 2, 'Continue', {
        color: '#fff4d0',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    const feedback = this.scene.add
      .container(0, 0, [
        shadow,
        panel,
        header,
        levelText,
        summaryLabel,
        unlockText,
        continueButton,
        continueText
      ])
      .setDepth(LEVEL_UP_PANEL_DEPTH);

    const dismiss = (): void => {
      if (this.activeLevelUpFeedback !== feedback) {
        return;
      }

      this.clearLevelUpFeedback();
      onAcknowledge();
    };

    overlay.on('pointerdown', () => undefined);
    continueButton.on('pointerdown', dismiss);
    this.activeLevelUpOverlay = overlay;
    this.activeLevelUpFeedback = feedback;

    this.scene.tweens.add({
      targets: feedback,
      scale: { from: 0.94, to: 1 },
      duration: 180,
      ease: 'Back.Out'
    });
  }

  private clearLevelUpFeedback(): void {
    if (this.activeLevelUpFeedback !== undefined) {
      this.scene.tweens.killTweensOf(this.activeLevelUpFeedback);
      this.activeLevelUpFeedback.destroy();
      this.activeLevelUpFeedback = undefined;
    }

    this.activeLevelUpOverlay?.destroy();
    this.activeLevelUpOverlay = undefined;
  }

  showOrderComplete(x: number, y: number): void {
    const text = this.scene.add
      .text(x, y, 'Order Complete!', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        stroke: '#4f6b35',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(115);

    this.scene.tweens.add({
      targets: text,
      y: y - 28,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  showPlotsUnlocked(x: number, y: number): void {
    const text = this.scene.add
      .text(x, y, 'Plots Unlocked!', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        stroke: '#4f6b35',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(115);

    this.scene.tweens.add({
      targets: text,
      y: y - 28,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  showOfflineSummary(count: number, x: number, y: number): void {
    const text = this.scene.add
      .text(x, y, `${count} crops finished growing while you were away.`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        stroke: '#4f6b35',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 320 }
      })
      .setOrigin(0.5)
      .setDepth(115);

    this.scene.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: 2600,
      ease: 'Sine.easeOut',
      delay: 1200,
      onComplete: () => text.destroy()
    });
  }

  private showFloatingText(
    message: string,
    x: number,
    y: number,
    duration: number,
    rise: number,
    color = FLOAT_TEXT_COLOR,
    depth = 120
  ): void {
    const text = this.scene.add
      .text(x, y, message, {
        color,
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        stroke: FLOAT_TEXT_STROKE,
        strokeThickness: 3,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(depth);

    this.scene.tweens.add({
      targets: text,
      y: y - rise,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private showPop(x: number, y: number, fill: number, depth = 99): void {
    const pop = this.scene.add.circle(x, y, 4, fill, 0.9).setDepth(depth);

    this.scene.tweens.add({
      targets: pop,
      scale: 3,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => pop.destroy()
    });
  }

  private showRewardBurst(x: number, y: number): void {
    for (let index = 0; index < 8; index += 1) {
      const angle = Phaser.Math.DegToRad(index * 45);
      const particle = this.scene.add.circle(x, y, 3, POP_FILL, 0.9).setDepth(110);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 26,
        y: y + Math.sin(angle) * 18,
        alpha: 0,
        duration: 420,
        ease: 'Sine.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private formatAggregateHarvestText(): string {
    const parts = Array.from(this.aggregateHarvestCounts.values())
      .map(({ cropName, count }) => `${count} ${cropName}`);

    return `Gathered ${parts.join(', ')}`;
  }

  private fadeAggregateHarvestText(): void {
    const text = this.aggregateHarvestText;

    if (text === undefined || !text.active) {
      this.aggregateHarvestCounts.clear();
      this.aggregateHarvestFadeTween = undefined;
      return;
    }

    this.aggregateHarvestFadeTween = this.scene.tweens.add({
      targets: text,
      y: text.y - 18,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => {
        text.destroy();
        this.aggregateHarvestText = undefined;
        this.aggregateHarvestFadeTween = undefined;
        this.aggregateHarvestCounts.clear();
      }
    });
  }

  private showFlyCircle(config: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    fill: number;
    radius: number;
    delay: number;
    duration: number;
  }): void {
    const marker = this.scene.add
      .circle(config.sourceX, config.sourceY, config.radius, config.fill, 1)
      .setDepth(121);

    this.scene.tweens.add({
      targets: marker,
      x: config.targetX,
      y: config.targetY,
      scale: 0.72,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: 'Sine.easeInOut',
      onComplete: () => marker.destroy()
    });
  }

  private showItemFlyEffect(
    itemId: ItemId,
    source: IsometricPoint,
    target: IsometricPoint,
    size: number,
    duration: number,
    depth: number
  ): void {
    const icon = createItemIcon(this.scene, itemId, source.x, source.y, size, { depth });

    this.scene.tweens.add({
      targets: icon,
      x: target.x,
      y: target.y,
      scale: 0.82,
      alpha: 0,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => icon.destroy()
    });
  }
}
