import V2 from "./v2";
import Ball from "./ball";
import Player from "./player";
import { GameState, GameDI } from "./states/GameState";
import { MenuState } from "./states/MenuState";
import { PlayState } from "./states/PlayState";
import { PauseState } from "./states/PauseState";
import { GameOverState } from "./states/GameOverState";

// Canvas setup
export const canvas = document.getElementById("main") as HTMLCanvasElement;
export const context = canvas.getContext("2d") as CanvasRenderingContext2D;

// Game constants
export const PADDLE_WIDTH = 20;
export const PADDLE_HEIGHT = 200;
export const RADIUS = 40;
export const WALL_THICKNESS = 6;
export const DIRECTION_MAP = {
  KeyS: new V2(0, 1),
  KeyW: new V2(0, -1),
};

/**
 * Main Game class handling state management
 * This class serves as a state machine for the game, where each state manages its own animation loop
 */
export class Game implements GameDI {
  // Game objects - these could be moved to a GameData class in the future
  ball: Ball = new Ball();
  player_one: Player = new Player(
    "player1",
    new V2(50, window.innerHeight / 2)
  );
  player_two: Player = new Player(
    "player2",
    new V2(window.innerWidth - 50, window.innerHeight / 2)
  );
  pressedKeys: Set<string> = new Set();

  // State management
  currentState: GameState;
  menuState: MenuState;
  playState: PlayState;
  pauseState: PauseState;
  gameOverState: GameOverState;

  constructor() {
    // Initialize game objects

    // Initialize states
    this.menuState = new MenuState();
    this.playState = new PlayState();
    this.pauseState = new PauseState();
    this.gameOverState = new GameOverState();

    // Set up input handlers

    // Set initial state and start it
    this.currentState = this.menuState;
    this.currentState.enter(this);
  }

  /**
   * Changes the current game state
   * The old state's loop is stopped and the new state's loop is started
   */
  changeState(newState: GameState): void {
    // Exit the current state
    this.currentState.exit(this);

    // Change to the new state
    this.currentState = newState;

    // Enter the new state
    this.currentState.enter(this);
  }

  /**
   * Handles keydown events and passes them to the current state
   */
  handleKeyDown(event: KeyboardEvent): void {
    this.pressedKeys.add(event.code);
    this.currentState.handleInput(this, event.code, true);
  }

  /**
   * Handles keyup events and passes them to the current state
   */
  handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.code);
    this.currentState.handleInput(this, event.code, false);
  }

  /**
   * Helper method to draw walls - used by multiple states
   */
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

// Initialize game when the window loads
window.onload = () => {
  const game = new Game();

  // Set up event listeners
  window.addEventListener("keydown", (e) => game.handleKeyDown(e));
  window.addEventListener("keyup", (e) => game.handleKeyUp(e));
};
