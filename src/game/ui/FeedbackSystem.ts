import Phaser from 'phaser';
import type { IsometricPoint } from '../models/GridTypes';

const FLOAT_TEXT_COLOR = '#fff7cc';
const FLOAT_TEXT_STROKE = '#3f512e';
const POP_FILL = 0xffe27a;

export class FeedbackSystem {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showHarvestFeedback(position: IsometricPoint, cropName: string): void {
    this.showFloatingText(`+1 ${cropName}`, position.x, position.y - 34, 800, 28);
    this.showPop(position.x, position.y - 8, POP_FILL);
  }

  showPlantingFeedback(position: IsometricPoint, seedCost: number): void {
    this.showFloatingText(`-${seedCost}c`, position.x, position.y - 24, 620, 18, '#fff0a8');
  }

  showCropSold(x: number, y: number, cropName: string, coins: number): void {
    this.showFloatingText(`Sold ${cropName} +${coins}c`, x, y, 760, 22, '#fff4a8');
  }

  showOrderRewards(x: number, y: number, coins: number, xp: number): void {
    this.showFloatingText(`+${coins}c  +${xp} XP`, x, y, 900, 24, '#fff4a8');
    this.showRewardBurst(x, y + 8);
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
}
