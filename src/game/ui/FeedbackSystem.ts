import Phaser from 'phaser';
import type { CropId } from '../models/CropTypes';
import type { IsometricPoint } from '../models/GridTypes';

const FLOAT_TEXT_COLOR = '#fff7cc';
const FLOAT_TEXT_STROKE = '#3f512e';
const POP_FILL = 0xffe27a;
const HARVEST_FLY_WINDOW_MS = 320;
const MAX_HARVEST_FLY_EFFECTS_PER_WINDOW = 4;
const HARVEST_AGGREGATE_FADE_DELAY_MS = 620;
const CROP_FEEDBACK_FILL: Record<CropId, number> = {
  sunwheat: 0xffd65f,
  carrot: 0xf28a3b,
  glowberry: 0xb86cff
};

export class FeedbackSystem {
  private readonly scene: Phaser.Scene;
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

  showCropSold(x: number, y: number, cropName: string, coins: number): void {
    this.showFloatingText(`Sold ${cropName} +${coins}c`, x, y, 760, 22, '#fff4a8');
  }

  showProductionStarted(x: number, y: number): void {
    this.showFloatingText('Mill Started', x, y, 720, 20, '#fff4a8');
  }

  showProductionReady(x: number, y: number): void {
    this.showFloatingText('Flour Ready!', x, y, 850, 22, '#fff4a8');
    this.showPop(x, y + 8, POP_FILL);
  }

  showProductionCollected(x: number, y: number, itemName: string, amount: number): void {
    this.showFloatingText(`+${amount} ${itemName}`, x, y, 800, 24, '#fff4a8');
    this.showPop(x, y + 8, POP_FILL);
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
    this.showFloatingText(`+${coins} Coins`, sourceX, sourceY - 18, 1000, 30, '#fff4a8');

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

  showLevelUp(level: number, x: number, y: number): void {
    const text = this.scene.add
      .text(x, y, `Level ${level}!`, {
        color: '#fff4a8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        stroke: '#3f512e',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(120);

    text.setScale(0.72);

    this.scene.tweens.add({
      targets: text,
      y: y - 36,
      scale: 1.12,
      alpha: 0,
      duration: 1200,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
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
    color = FLOAT_TEXT_COLOR
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
      .setDepth(120);

    this.scene.tweens.add({
      targets: text,
      y: y - rise,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private showPop(x: number, y: number, fill: number): void {
    const pop = this.scene.add.circle(x, y, 4, fill, 0.9).setDepth(99);

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
}
