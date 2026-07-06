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
    const text = this.scene.add
      .text(position.x, position.y - 34, `+1 ${cropName}`, {
        color: FLOAT_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        stroke: FLOAT_TEXT_STROKE,
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(100);

    const pop = this.scene.add
      .circle(position.x, position.y - 8, 4, POP_FILL, 0.9)
      .setDepth(99);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });

    this.scene.tweens.add({
      targets: pop,
      scale: 3,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => pop.destroy()
    });
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
}
