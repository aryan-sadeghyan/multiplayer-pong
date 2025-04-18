// PlayState.ts - Handles the main gameplay

import { GameState, GameDI } from "./GameState";
import { DIRECTION_MAP, WALL_THICKNESS, canvas, context } from "../main";

export class PlayState implements GameState {
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;

  enter(gameDI: GameDI): void {
    console.log("Entered play state");
    // Initialize game state
    gameDI.ball.start();

    // Start the animation loop
    this.startLoop(gameDI);
  }

  exit(gameDI: GameDI): void {
    console.log("Exited play state");
    // Stop the animation loop
    this.stopLoop();
  }

  update(gameDI: GameDI, dt: number): void {
    // Update ball position
    gameDI.ball.update(dt);

    // Handle player movement based on pressed keys
    if (gameDI.pressedKeys.has("KeyS")) {
      gameDI.player_one.update(DIRECTION_MAP.KeyS, dt);
    }
    if (gameDI.pressedKeys.has("KeyW")) {
      gameDI.player_one.update(DIRECTION_MAP.KeyW, dt);
    }
    if (gameDI.pressedKeys.has("ArrowDown")) {
      gameDI.player_two.update(DIRECTION_MAP.KeyS, dt);
    }
    if (gameDI.pressedKeys.has("ArrowUp")) {
      gameDI.player_two.update(DIRECTION_MAP.KeyW, dt);
    }

    // Check ball collisions
    gameDI.ball.checkWall();
    gameDI.ball.checkPaddle(gameDI.player_one.position);
    gameDI.ball.checkAiPaddle(gameDI.player_two.position);

    // Ensure paddles stay within boundaries
    gameDI.player_one.checkBoundaries();
    gameDI.player_two.checkBoundaries();

    // Check for scoring
    const result = gameDI.ball.checkScore();
    if (result) {
      if (result === "left") {
        gameDI.player_two.score++;
      } else {
        gameDI.player_one.score++;
      }

      // Check for game over
      if (gameDI.player_one.score >= 5 || gameDI.player_two.score >= 5) {
        gameDI.changeState(gameDI.gameOverState);
      } else {
        gameDI.ball.reset();
      }
    }
  }

  render(gameDI: GameDI, ctx: CanvasRenderingContext2D): void {
    // Clear screen
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw game elements
    this.drawWalls(ctx);
    gameDI.player_one.draw(ctx);
    gameDI.player_two.draw(ctx);
    gameDI.ball.draw(ctx);

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "24px 'Lexend Mega'";
    ctx.textAlign = "center";
    ctx.fillText(
      `${gameDI.player_two.score} - ${gameDI.player_one.score}`,
      ctx.canvas.width / 2,
      30
    );
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void {
    // Handle pause
    if (pressed && keyCode === "Escape") {
      gameDI.changeState(gameDI.pauseState);
    }
  }

  /**
   * Starts the animation loop for this state
   */
  startLoop(gameDI: GameDI): void {
    // Reset the timestamp
    this.lastTimestamp = 0;

    // Define the loop function
    const loop = (timestamp: number) => {
      // Handle canvas resizing
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Calculate delta time
      if (this.lastTimestamp === 0) {
        this.lastTimestamp = timestamp;
      }
      const dt = (timestamp - this.lastTimestamp) * 0.001;
      this.lastTimestamp = timestamp;

      // Update and render
      this.update(gameDI, dt);
      this.render(gameDI, context);

      // Continue the loop
      this.animationFrameId = requestAnimationFrame(loop);
    };

    // Start the loop
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stops the animation loop for this state
   */
  stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  drawWalls(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "white";
    ctx.lineWidth = WALL_THICKNESS;

    ctx.beginPath();
    ctx.moveTo(0, WALL_THICKNESS / 2);
    ctx.lineTo(window.innerWidth, WALL_THICKNESS / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight - WALL_THICKNESS / 2);
    ctx.lineTo(window.innerWidth, window.innerHeight - WALL_THICKNESS / 2);
    ctx.stroke();
  }
}
