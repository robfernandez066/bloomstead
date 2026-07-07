import Phaser from 'phaser';
import type { ItemId } from '../models/ItemTypes';

interface ItemIconOptions {
  depth?: number;
  alpha?: number;
}

export function createItemIcon(
  scene: Phaser.Scene,
  itemId: ItemId,
  x: number,
  y: number,
  size: number,
  options: ItemIconOptions = {}
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const graphics = scene.add.graphics();
  const scale = size / 20;

  container.add(graphics);
  container.setAlpha(options.alpha ?? 1);

  if (options.depth !== undefined) {
    container.setDepth(options.depth);
  }

  graphics.setScale(scale);

  switch (itemId) {
    case 'sunwheat':
      drawSunwheat(graphics);
      break;
    case 'carrot':
      drawCarrot(graphics);
      break;
    case 'glowberry':
      drawGlowberry(graphics);
      break;
    case 'flour':
      drawFlour(graphics);
      break;
    case 'bread':
      drawBread(graphics);
      break;
  }

  return container;
}

function drawSunwheat(graphics: Phaser.GameObjects.Graphics): void {
  graphics.lineStyle(2, 0x5f7f35, 1);
  graphics.lineBetween(0, 7, 0, -6);
  graphics.lineBetween(-4, 7, -3, -3);
  graphics.lineBetween(4, 7, 3, -3);

  graphics.fillStyle(0xf3c64a, 1);
  [
    [0, -7],
    [-3, -4],
    [3, -4],
    [-5, -1],
    [5, -1],
    [-3, 2],
    [3, 2]
  ].forEach(([x, y]) => {
    graphics.fillEllipse(x, y, 4, 6);
  });
}

function drawCarrot(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x315f35, 1);
  graphics.fillTriangle(-7, -1, -3, -10, 0, -1);
  graphics.fillTriangle(-3, -2, 0, -12, 3, -2);
  graphics.fillTriangle(1, -1, 7, -9, 6, 0);
  graphics.fillStyle(0xe87832, 1);
  graphics.fillEllipse(0, 3, 10, 8);
  graphics.lineStyle(1, 0xb7532b, 0.7);
  graphics.lineBetween(-3, 2, 3, 2);
  graphics.lineBetween(-2, 5, 2, 5);
}

function drawGlowberry(graphics: Phaser.GameObjects.Graphics): void {
  graphics.lineStyle(2, 0x4d7a3b, 1);
  graphics.lineBetween(-6, -3, 5, 5);

  graphics.fillStyle(0x8c58d8, 1);
  graphics.fillCircle(-4, -4, 4);
  graphics.fillCircle(3, -1, 4);
  graphics.fillCircle(0, 6, 4);

  graphics.fillStyle(0xd8b7ff, 0.85);
  graphics.fillCircle(-5, -5, 1.2);
  graphics.fillCircle(2, -2, 1.2);
  graphics.fillCircle(-1, 5, 1.2);
}

function drawFlour(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0xf5ead0, 1);
  graphics.fillRoundedRect(-7, -6, 14, 15, 3);
  graphics.fillStyle(0xd2b98a, 1);
  graphics.fillRoundedRect(-5, -9, 10, 5, 2);
  graphics.lineStyle(1, 0x8f7448, 0.8);
  graphics.strokeRoundedRect(-7, -6, 14, 15, 3);
  graphics.lineBetween(-4, -3, 4, -3);
}

function drawBread(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0xc98035, 1);
  graphics.fillEllipse(0, 1, 18, 13);
  graphics.fillStyle(0xe8ad5a, 1);
  graphics.fillEllipse(0, -1, 15, 8);
  graphics.lineStyle(1.4, 0x8f5428, 0.8);
  graphics.lineBetween(-5, -3, -2, 2);
  graphics.lineBetween(0, -4, 2, 2);
  graphics.lineBetween(5, -3, 4, 2);
}
