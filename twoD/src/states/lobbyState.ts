import { GameState, GameDI } from "./GameState";
import { canvas, PADDLE_WIDTH, WALL_THICKNESS } from "../main";
import NetworkManager from "../networkManager";
import V2 from "../v2";

interface LobbyStateI extends GameState {
  enter(gameDI: GameDI): void;
  exit(gameDI?: GameDI): void;
  update(...args: any[]): void;
  render(...args: any[]): void;
  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void;
  startLoop(gameDI: GameDI): void;
  stopLoop(): void;
  createRoom(): void;
  joinRoom(): void;
  goBackToMenu(): void;
  initializeButtons(): void;
}

interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
}

export default class LobbyState implements LobbyStateI {
  private animationFrameId: number | null = null;
  private buttons: Button[] = [];
  private messages: string[] = [];
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private gameDI: GameDI | null = null;

  enter(gameDI: GameDI): void {
    console.log("Entering Lobby State");
    this.gameDI = gameDI;

    // Create buttons
    this.initializeButtons();

    // Add click listener
    this.clickHandler = this.handleClick.bind(this);
    canvas.addEventListener("click", this.clickHandler);

    // Add initial message
    this.addMessage("Welcome to the Lobby");

    this.startLoop(gameDI);
  }

  exit(gameDI: GameDI): void {
    console.log("Exiting Lobby State");

    // Remove click handler
    if (this.clickHandler) {
      canvas.removeEventListener("click", this.clickHandler);
      this.clickHandler = null;
    }

    this.stopLoop();
    this.gameDI = null;
  }

  initializeButtons(): void {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const btnWidth = 300;
    const btnHeight = 60;
    const btnX = canvasWidth / 2 - btnWidth / 2;

    this.buttons = [
      {
        x: btnX,
        y: 200,
        width: btnWidth,
        height: btnHeight,
        text: "Create Room",
        onClick: () => this.createRoom(),
      },
      {
        x: btnX,
        y: 300,
        width: btnWidth,
        height: btnHeight,
        text: "Join Room",
        onClick: () => this.joinRoom(),
      },
      {
        x: btnX,
        y: 400,
        width: btnWidth,
        height: btnHeight,
        text: "Back to Menu",
        onClick: () => this.goBackToMenu(),
      },
    ];
  }

  handleClick(e: MouseEvent): void {
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if any button was clicked
    for (const button of this.buttons) {
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        button.onClick();
        break;
      }
    }
  }

  createRoom(): void {
    // Calculate initial position for the paddle
    const initialX = PADDLE_WIDTH - WALL_THICKNESS;
    const initialY = window.innerHeight / 2;

    // Connect to server with initial position
    NetworkManager.Instance.connect({ x: initialX, y: initialY });

    if (this.gameDI) {
      this.gameDI.changeState(this.gameDI.multiplayerPlayState);
    }
  }

  joinRoom(): void {
    // In a real implementation, this would prompt for a room ID
    this.addMessage("Enter Room ID to join...");
    // Simulating a join after a timeout
    setTimeout(() => {
      this.addMessage("Joined room successfully!");
    }, 1500);
  }

  goBackToMenu(): void {
    if (this.gameDI) {
      this.gameDI.changeState(this.gameDI.menuState);
    }
  }

  addMessage(message: string): void {
    this.messages.push(message);
    // Keep only the last 5 messages
    if (this.messages.length > 5) {
      this.messages.shift();
    }
  }

  update(dt: number): void {
    // No continuous updates needed for lobby
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Title
    ctx.fillStyle = "white";
    ctx.font = "48px 'Lexend Mega'";
    ctx.textAlign = "center";
    ctx.fillText("Lobby", ctx.canvas.width / 2, 100);

    // Draw buttons
    this.buttons.forEach((button) => {
      // Button background
      ctx.fillStyle = "#333";
      ctx.fillRect(button.x, button.y, button.width, button.height);

      // Button border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(button.x, button.y, button.width, button.height);

      // Button text
      ctx.fillStyle = "white";
      ctx.font = "24px 'Lexend Mega'";
      ctx.textAlign = "center";
      ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2 + 8
      );
    });

    // Message display area
    const messageAreaX = ctx.canvas.width / 2 - 350;
    const messageAreaY = 500;
    const messageAreaWidth = 700;
    const messageAreaHeight = 150;

    // Message area background
    ctx.fillStyle = "#111";
    ctx.fillRect(
      messageAreaX,
      messageAreaY,
      messageAreaWidth,
      messageAreaHeight
    );

    // Message area border
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      messageAreaX,
      messageAreaY,
      messageAreaWidth,
      messageAreaHeight
    );

    // Draw messages
    ctx.fillStyle = "white";
    ctx.font = "18px 'Lexend Mega'";
    ctx.textAlign = "left";

    this.messages.forEach((message, index) => {
      ctx.fillText(message, messageAreaX + 20, messageAreaY + 30 + index * 25);
    });
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void {
    if (pressed) {
      if (keyCode === "Escape") {
        gameDI.changeState(gameDI.menuState);
      }
    }
  }

  startLoop(gameDI: GameDI): void {
    console.log("Starting Loop for Lobby State");

    const loop = () => {
      const context = canvas.getContext("2d");
      if (context) {
        // Ensure canvas dimensions are up to date
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Re-initialize buttons on resize
        this.initializeButtons();

        this.render(context);
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  stopLoop(): void {
    console.log("Stopping Loop for Lobby State");
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
