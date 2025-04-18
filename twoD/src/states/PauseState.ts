// PauseState.ts - Handles the game pause menu

import { WALL_THICKNESS, context } from "../main";
import { GameState, GameDI } from "./GameState";

export class PauseState implements GameState {
  private animationFrameId: number | null = null;

  enter(gameDI: GameDI): void {
    console.log("Entered pause state");
    this.render(context);
  }

  exit(gameDI: GameDI): void {
    console.log("Exited pause state");
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  update(dt: number): void {
    // No updates during pause
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear the screen
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw help information
    ctx.fillStyle = "white";
    ctx.font = "48px 'Lexend Mega'";
    ctx.textAlign = "center";
    ctx.fillText("GAME CONTROLS", ctx.canvas.width / 2, 120);

    // Draw control instructions
    ctx.font = "24px 'Lexend Mega'";
    ctx.fillText("Player 1:", ctx.canvas.width / 2, 200);
    ctx.fillText("W - move up", ctx.canvas.width / 2, 240);
    ctx.fillText("S - move down", ctx.canvas.width / 2, 280);

    ctx.fillText("Player 2:", ctx.canvas.width / 2, 340);
    ctx.fillText("↑ (Up arrow) - move up", ctx.canvas.width / 2, 380);
    ctx.fillText("↓ (Down arrow) - move down", ctx.canvas.width / 2, 420);

    ctx.fillText("Press any key to start the game", ctx.canvas.width / 2, 500);
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void {
    if (pressed) {
      // Any key press will start the game
      console.log("Starting game");
      gameDI.changeState(gameDI.playState);
    }
  }

  startLoop(): void {
    // Not needed in pause state as it's a static screen
    this.render(context);
  }

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
