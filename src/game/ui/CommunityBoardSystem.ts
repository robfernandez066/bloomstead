import Phaser from 'phaser';

const LANDMARK_DEPTH = 18;
const HIT_DEPTH = LANDMARK_DEPTH + 3;
const WOOD_FILL = 0x9b673d;
const WOOD_DARK = 0x684326;
const PAPER_FILL = 0xf4e6b3;
const PAPER_STROKE = 0x6f5734;
const TEXT_COLOR = '#2f3b26';
const READY_FILL = 0xdff0ad;
const READY_STROKE = 0x496f38;
const HIGHLIGHT_FILL = 0xffe27a;

interface CommunityBoardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CommunityBoardConfig extends CommunityBoardBounds {
  onOpen: () => void;
  isReady: () => boolean;
  isHighlighted?: () => boolean;
}

export class CommunityBoardSystem {
  private readonly scene: Phaser.Scene;
  private config?: CommunityBoardConfig;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly animatedTargets: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(config: CommunityBoardConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();

    const { x, y, width, height } = this.config;
    const centerX = x + width / 2;
    const ready = this.config.isReady();
    const highlighted = this.config.isHighlighted?.() === true;

    if (highlighted) {
      const highlight = this.scene.add
        .rectangle(x, y, width, height, HIGHLIGHT_FILL, 0.14)
        .setOrigin(0, 0)
        .setStrokeStyle(3, HIGHLIGHT_FILL)
        .setDepth(LANDMARK_DEPTH - 1);

      this.scene.tweens.add({
        targets: highlight,
        alpha: 0.32,
        scale: 1.04,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.objects.push(highlight);
      this.animatedTargets.push(highlight);
    }

    const shadow = this.scene.add
      .ellipse(centerX, y + height - 4, width - 10, 12, 0x355b35, 0.3)
      .setDepth(LANDMARK_DEPTH - 1);
    const leftPost = this.scene.add
      .rectangle(x + 17, y + 18, 8, height - 14, WOOD_DARK)
      .setOrigin(0, 0)
      .setStrokeStyle(2, WOOD_DARK)
      .setDepth(LANDMARK_DEPTH);
    const rightPost = this.scene.add
      .rectangle(x + width - 25, y + 18, 8, height - 14, WOOD_DARK)
      .setOrigin(0, 0)
      .setStrokeStyle(2, WOOD_DARK)
      .setDepth(LANDMARK_DEPTH);
    const board = this.scene.add
      .rectangle(x + 5, y + 8, width - 10, 52, WOOD_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(3, WOOD_DARK)
      .setDepth(LANDMARK_DEPTH + 1);
    const paperA = this.scene.add
      .rectangle(x + 15, y + 17, 23, 25, PAPER_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PAPER_STROKE)
      .setAngle(-3)
      .setDepth(LANDMARK_DEPTH + 2);
    const paperB = this.scene.add
      .rectangle(x + 50, y + 16, 22, 28, PAPER_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PAPER_STROKE)
      .setAngle(3)
      .setDepth(LANDMARK_DEPTH + 2);
    const labelPanel = this.scene.add
      .rectangle(centerX, y + 53, 58, 21, PAPER_FILL)
      .setStrokeStyle(2, PAPER_STROKE)
      .setDepth(LANDMARK_DEPTH + 2);
    const label = this.scene.add
      .text(centerX, y + 53, 'Orders', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(LANDMARK_DEPTH + 3);
    const hitArea = this.scene.add
      .rectangle(x, y, width, height, 0xffffff, 0.001)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(HIT_DEPTH);

    hitArea.on('pointerdown', () => this.config?.onOpen());
    this.objects.push(shadow, leftPost, rightPost, board, paperA, paperB, labelPanel, label, hitArea);

    if (ready) {
      const readyBubble = this.scene.add
        .circle(x + width - 8, y + 8, 13, READY_FILL)
        .setStrokeStyle(3, READY_STROKE)
        .setDepth(HIT_DEPTH + 1);
      const readyLabel = this.scene.add
        .text(x + width - 8, y + 8, '!', {
          color: '#2f3b26',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(HIT_DEPTH + 2);

      this.scene.tweens.add({
        targets: [readyBubble, readyLabel],
        scale: 1.12,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.objects.push(readyBubble, readyLabel);
      this.animatedTargets.push(readyBubble, readyLabel);
    }
  }

  getHitBounds(): Phaser.Geom.Rectangle {
    if (this.config === undefined) {
      return new Phaser.Geom.Rectangle();
    }

    return new Phaser.Geom.Rectangle(
      this.config.x,
      this.config.y,
      this.config.width,
      this.config.height
    );
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
