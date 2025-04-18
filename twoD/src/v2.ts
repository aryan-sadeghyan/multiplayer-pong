export default class V2 {
  readonly x: number;
  readonly y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(other: V2) {
    return new V2(this.x + other.x, this.y + other.y);
  }

  subtract(other: V2) {
    return new V2(this.x - other.x, this.y - other.y);
  }

  scaler(scale: number) {
    return new V2(this.x * scale, this.y * scale);
  }
}
