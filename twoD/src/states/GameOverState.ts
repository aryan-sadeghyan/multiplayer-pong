// GameOverState.ts - Handles the game over screen

import { GameState, GameDI } from "./GameState";
import { context } from "../main";

export class GameOverState implements GameState {
  // You can add winner info or other game over data
  private winner: string = "";
  private animationFrameId: number | null = null;

  enter(gameDI: GameDI): void {
    console.log("Entered game over state");

    // Determine the winner
    this.winner =
      gameDI.player_one.score > gameDI.player_two.score
        ? "Player 1"
        : "Player 2";

    // Render the game over screen
    this.render(context);
  }

  exit(gameDI: GameDI): void {
    console.log("Exited game over state");

    // Reset scores when leaving game over state
    gameDI.player_one.score = 0;
    gameDI.player_two.score = 0;

    // Stop any running animation
    this.stopLoop();
  }

  update(dt: number): void {
    // Minimal updates needed for game over screen
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear screen
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw game over message
    ctx.fillStyle = "white";
    ctx.font = "48px 'Lexend Mega'";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", ctx.canvas.width / 2, 100);

    // Draw winner if available
    if (this.winner) {
      ctx.font = "36px 'Lexend Mega'";
      ctx.fillText(`${this.winner} wins!`, ctx.canvas.width / 2, 180);
    }

    // Draw options
    ctx.font = "24px 'Lexend Mega'";
    ctx.fillText("Press ENTER to play again", ctx.canvas.width / 2, 300);
    ctx.fillText("Press M for main menu", ctx.canvas.width / 2, 340);
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void {
    if (pressed) {
      switch (keyCode) {
        case "Enter":
          console.log("Restarting game");
          // Reset game and go to play state
          gameDI.ball.reset();
          gameDI.changeState(gameDI.playState);
          break;
        case "KeyM":
          console.log("Going to main menu");
          gameDI.changeState(gameDI.menuState);
          break;
      }
    }
  }

  startLoop(gameDI: GameDI): void {
    // Just render once, no animation loop needed
    this.render(context);
  }

  stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
