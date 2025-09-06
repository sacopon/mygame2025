export type SpriteHandle = string;

export interface Transform2D {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export const identityTransform: Transform2D = {
  x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
};
