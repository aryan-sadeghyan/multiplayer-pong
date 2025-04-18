import { WALL_THICKNESS, RADIUS, PADDLE_WIDTH, PADDLE_HEIGHT } from "./main";
import V2 from "./v2";

interface BallI {
  start: () => void;
  draw: (context: CanvasRenderingContext2D) => void;
  update: (dt: number) => void;
  checkWall: () => void;
  checkPaddle: (paddlePos: V2) => void;
}

// Define the radius of the ball

export default class Ball implements BallI {
  private vel: V2;
  private pos: V2;
  private resetTimeout: number | null = null;

  constructor() {
    this.vel = new V2(0, 0);
    this.pos = new V2(window.innerWidth / 2, window.innerHeight / 2);
  }

  getPosition(): V2 {
    return this.pos;
  }

  setPosition(pos: V2) {
    this.pos = pos;
  }

  start() {
    const quadrantAngle = (Math.random() * 60 - 30) * (Math.PI / 180);

    const direction = Math.random() < 0.5 ? 1 : -1;

    const speed = 1200;
    this.vel = new V2(
      Math.cos(quadrantAngle) * speed * direction,
      Math.sin(quadrantAngle) * speed * direction
    );
    console.log(this.vel);
  }
  draw(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(this.pos.x, this.pos.y, RADIUS, 0, Math.PI * 2);
    context.fillStyle = "white";
    context.fill();
  }
  update(dt: number) {
    this.pos = this.pos.add(this.vel.scaler(dt));
  }

  checkWall() {
    // if (this.pos.x + RADIUS >= window.innerWidth - WALL_THICKNESS) {
    //   this.vel = new V2(-this.vel.x, this.vel.y);
    // }

    if (this.pos.y - RADIUS <= WALL_THICKNESS) {
      this.vel = new V2(this.vel.x, -this.vel.y);
    }

    if (this.pos.y + RADIUS >= window.innerHeight - WALL_THICKNESS) {
      this.vel = new V2(this.vel.x, -this.vel.y);
    }
  }
  checkPaddle(paddlePos: V2) {
    if (
      this.pos.x - RADIUS <= paddlePos.x + PADDLE_WIDTH &&
      this.pos.x + RADIUS >= paddlePos.x &&
      this.pos.y + RADIUS >= paddlePos.y &&
      this.pos.y - RADIUS <= paddlePos.y + PADDLE_HEIGHT
    ) {
      this.pos = new V2(paddlePos.x + PADDLE_WIDTH + RADIUS, this.pos.y);
      this.vel = new V2(-this.vel.x, this.vel.y);
    }
  }
  checkAiPaddle(paddlePos: V2) {
    if (
      this.pos.x + RADIUS >= paddlePos.x && // Changed from <= to >=
      this.pos.x - RADIUS <= paddlePos.x + PADDLE_WIDTH && // Changed order
      this.pos.y + RADIUS >= paddlePos.y &&
      this.pos.y - RADIUS <= paddlePos.y + PADDLE_HEIGHT
    ) {
      // Move ball to just before the paddle
      this.pos = new V2(paddlePos.x - RADIUS, this.pos.y);
      this.vel = new V2(-this.vel.x, this.vel.y);
    }
  }

  checkScore(): string | null {
    // Check if ball is past left or right edge
    if (this.pos.x + RADIUS < 0) {
      return "right"; // Right player scored
    } else if (this.pos.x - RADIUS > window.innerWidth) {
      return "left"; // Left player scored
    }
    return null;
  }

  reset() {
    this.pos = new V2(window.innerWidth / 2, window.innerHeight / 2);
    this.vel = new V2(0, 0);

    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = window.setTimeout(() => {
      this.start();
      this.resetTimeout = null;
    }, 1500);
  }
}
