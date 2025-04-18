// MenuState.ts - Handles the main menu

import { GameState, GameDI } from "./GameState";
import { canvas, context } from "../main";

export class MenuState implements GameState {
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private titlePulse: number = 72; // Used for simple animation effect
  private titleSize: number = 72; // Store the calculated title size

  private menuOptions = [
    { text: "play VS ai", key: "Space" },
    { text: "custom multiplayer", key: "2" },
  ];

  enter(): void {
    console.log("Entered menu state");
    this.startLoop();
  }

  exit(): void {
    this.stopLoop();
  }

  render(arg1?: any, arg2?: CanvasRenderingContext2D): void {
    // Use provided context or default
    const renderContext =
      arg2 || (arg1 instanceof CanvasRenderingContext2D ? arg1 : context);

    // Clear the screen
    renderContext.fillStyle = "black";
    renderContext.fillRect(
      0,
      0,
      renderContext.canvas.width,
      renderContext.canvas.height
    );

    // Draw title
    renderContext.fillStyle = "white";
    renderContext.font = `${this.titleSize}px 'Lexend Mega'`;
    renderContext.textAlign = "center";
    renderContext.fillText("PONG", renderContext.canvas.width / 2, 120);

    // Draw menu options as simple text
    renderContext.font = "30px 'Lexend Mega'";
    renderContext.fillStyle = "white";

    // Button positions
    const buttonPositions = [240, 320];

    // Draw menu options
    for (let i = 0; i < this.menuOptions.length; i++) {
      renderContext.fillText(
        `${this.menuOptions[i].text} : press "${this.menuOptions[i].key}"`,
        renderContext.canvas.width / 2,
        buttonPositions[i]
      );
    }
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void {
    if (pressed) {
      if (keyCode === "Space") {
        console.log("Starting game (Space pressed)");
        gameDI.changeState(gameDI.pauseState);
      }
    }
  }

  update(dt: number): void {
    // Simple animation for the title
    this.titlePulse += dt * 2;
    if (this.titlePulse > Math.PI * 2) {
      this.titlePulse -= Math.PI * 2;
    }

    // Calculate the title size based on the pulse
    const pulseFactor = 1 + 0.1 * Math.sin(this.titlePulse);
    this.titleSize = 72 * pulseFactor;
  }

  /**
   * Starts the animation loop for this state
   */
  startLoop(): void {
    // Reset animation values
    this.titlePulse = 0;
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
      this.update(dt);
      this.render(context);

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
}
