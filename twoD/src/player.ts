import { PADDLE_HEIGHT, PADDLE_WIDTH, WALL_THICKNESS } from "./main";
import V2 from "./v2";

interface PlayerI {
  position: V2;
  width: number;
  height: number;
  speed: number;
  id: string;
  score: number;
  update: (direction: V2, dt: number) => void;
  draw: (context: CanvasRenderingContext2D) => void;
  checkBoundaries: () => void;
}

export default class Player implements PlayerI {
  position: V2;
  width: number = PADDLE_WIDTH;
  height: number = PADDLE_HEIGHT;
  speed: number = 1400;
  id: string;
  score: number = 0;
  constructor(id: string, position: V2) {
    this.id = id;
    this.position = position;
  }
  update(direction: V2, dt: number) {
    this.position = this.position.add(direction.scaler(this.speed * dt));
    this.checkBoundaries();
  }

  checkBoundaries() {
    this.position = new V2(
      this.position.x,
      Math.max(
        WALL_THICKNESS,
        Math.min(
          window.innerHeight - PADDLE_HEIGHT - WALL_THICKNESS,
          this.position.y
        )
      )
    );
  }

  draw(context: CanvasRenderingContext2D) {
    context.strokeStyle = "white";
    context.strokeRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
}
