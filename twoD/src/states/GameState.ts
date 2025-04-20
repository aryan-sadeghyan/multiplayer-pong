// GameState.ts - Interface for all game states
import Ball from "../ball";
import Player from "../player";

export interface GameDI {
  // Game objects
  ball: Ball;
  player_one: Player;
  player_two: Player;
  pressedKeys: Set<string>;

  // State references for transitions
  menuState: GameState;
  playState: GameState;
  pauseState: GameState;
  gameOverState: GameState;
  lobbyState: GameState;
  multiplayerPlayState: GameState;

  // Methods
  changeState(newState: GameState): void;
  drawWalls?(context: CanvasRenderingContext2D): void;
}

export interface GameState {
  // Called when entering the state - should start the state's animation loop
  enter(gameDI?: GameDI): void;

  // Called when exiting the state - should stop the state's animation loop
  exit(gameDI?: GameDI): void;

  // Update game logic for this stat
  update(...args: any[]): void;

  // Render method with multiple possible signatures
  render(...args: any[]): void;

  // Handle input for this state
  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void;

  // Start the animation loop for this state
  startLoop(gameDI: GameDI): void;

  // Stop the animation loop for this state
  stopLoop(): void;

  // Optional method for drawing walls
  drawWalls?(context: CanvasRenderingContext2D): void;
}
