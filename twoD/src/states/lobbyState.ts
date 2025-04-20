import { GameState, GameDI } from "./GameState";
import { canvas, PADDLE_WIDTH, WALL_THICKNESS } from "../main";
import NetworkManager, { RoomInfo } from "../networkManager";
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
  showJoinRoomDialog(): void;
  joinSelectedRoom(): void;
  refreshRooms(): void;
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
  private networkManager: NetworkManager;
  private availableRooms: string[] = [];
  private selectedRoomId: string | null = null;
  private showRoomDialog: boolean = false;
  private isJoining: boolean = false;
  private roomInputValue: string = "";

  constructor() {
    this.networkManager = NetworkManager.Instance;
  }

  enter(gameDI: GameDI): void {
    console.log("Entering Lobby State");
    this.gameDI = gameDI;

    // Connect to server
    this.networkManager.connect();

    // Set up callbacks
    this.setupNetworkCallbacks();

    // Create buttons
    this.initializeButtons();

    // Add click listener
    this.clickHandler = this.handleClick.bind(this);
    canvas.addEventListener("click", this.clickHandler);

    // Add initial message
    this.addMessage("Welcome to the Lobby");

    // Get available rooms
    this.networkManager.getAvailableRooms();

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
    this.showRoomDialog = false;
    this.isJoining = false;
  }

  setupNetworkCallbacks(): void {
    // Room created callback
    this.networkManager.setRoomCreatedCallback((roomInfo: RoomInfo) => {
      this.addMessage(`Room created with ID: ${roomInfo.roomId}`);
      this.selectedRoomId = roomInfo.roomId;

      if (this.gameDI) {
        this.gameDI.changeState(this.gameDI.multiplayerPlayState);
      }
    });

    // Room joined callback
    this.networkManager.setRoomJoinedCallback((roomInfo: RoomInfo) => {
      this.addMessage(`Joined room: ${roomInfo.roomId}`);
      this.selectedRoomId = roomInfo.roomId;

      if (this.gameDI) {
        this.gameDI.changeState(this.gameDI.multiplayerPlayState);
      }
    });

    // Available rooms callback
    this.networkManager.setAvailableRoomsCallback((rooms: string[]) => {
      this.availableRooms = rooms;
      if (rooms.length === 0) {
        this.addMessage("No available rooms found");
      } else {
        this.addMessage(`Found ${rooms.length} available room(s)`);
      }
    });

    // Error callback
    this.networkManager.setErrorCallback((error: { message: string }) => {
      this.addMessage(`Error: ${error.message}`);
    });
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
        onClick: () => this.showJoinRoomDialog(),
      },
      {
        x: btnX,
        y: 400,
        width: btnWidth,
        height: btnHeight,
        text: "Refresh Rooms",
        onClick: () => this.refreshRooms(),
      },
      {
        x: btnX,
        y: 500,
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

    // If we're showing the room selection dialog
    if (this.showRoomDialog) {
      const dialogWidth = 400;
      const dialogHeight = 300;
      const dialogX = canvas.width / 2 - dialogWidth / 2;
      const dialogY = canvas.height / 2 - dialogHeight / 2;

      // Check if close button is clicked
      if (
        x >= dialogX + dialogWidth - 50 &&
        x <= dialogX + dialogWidth - 10 &&
        y >= dialogY + 10 &&
        y <= dialogY + 40
      ) {
        this.showRoomDialog = false;
        return;
      }

      // Check if input field is clicked
      if (
        x >= dialogX + 50 &&
        x <= dialogX + dialogWidth - 50 &&
        y >= dialogY + 150 &&
        y <= dialogY + 180
      ) {
        const roomId = prompt("Enter Room ID:", this.roomInputValue);
        if (roomId !== null) {
          this.roomInputValue = roomId;
        }
        return;
      }

      // Check if join button is clicked
      if (
        x >= dialogX + 100 &&
        x <= dialogX + 300 &&
        y >= dialogY + 200 &&
        y <= dialogY + 240
      ) {
        this.joinSelectedRoom();
        return;
      }

      // Check if room list items are clicked
      if (this.availableRooms.length > 0) {
        const listStartY = dialogY + 80;
        const itemHeight = 30;
        for (let i = 0; i < this.availableRooms.length; i++) {
          if (
            x >= dialogX + 50 &&
            x <= dialogX + dialogWidth - 50 &&
            y >= listStartY + i * itemHeight &&
            y <= listStartY + (i + 1) * itemHeight
          ) {
            this.roomInputValue = this.availableRooms[i];
            return;
          }
        }
      }

      return;
    }

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

    // Create room with initial position
    this.networkManager.createRoom({ x: initialX, y: initialY });
    this.addMessage("Creating room...");
  }

  showJoinRoomDialog(): void {
    this.showRoomDialog = true;
    this.isJoining = true;
    this.roomInputValue = "";

    // Refresh room list
    this.networkManager.getAvailableRooms();
  }

  joinSelectedRoom(): void {
    if (!this.roomInputValue) {
      this.addMessage("Please enter a room ID");
      return;
    }

    // Calculate initial position for the paddle
    const initialX = window.innerWidth - PADDLE_WIDTH - WALL_THICKNESS;
    const initialY = window.innerHeight / 2;

    // Join room with the entered room ID
    this.networkManager.joinRoom(this.roomInputValue, {
      x: initialX,
      y: initialY,
    });
    this.addMessage(`Joining room ${this.roomInputValue}...`);
    this.showRoomDialog = false;
  }

  refreshRooms(): void {
    this.networkManager.getAvailableRooms();
    this.addMessage("Refreshing room list...");
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
    const messageAreaY = 600;
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

    // Draw room selection dialog if active
    if (this.showRoomDialog) {
      this.renderRoomDialog(ctx);
    }
  }

  renderRoomDialog(ctx: CanvasRenderingContext2D): void {
    const dialogWidth = 400;
    const dialogHeight = 300;
    const dialogX = ctx.canvas.width / 2 - dialogWidth / 2;
    const dialogY = ctx.canvas.height / 2 - dialogHeight / 2;

    // Dialog background
    ctx.fillStyle = "#222";
    ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);

    // Dialog border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

    // Dialog title
    ctx.fillStyle = "white";
    ctx.font = "24px 'Lexend Mega'";
    ctx.textAlign = "center";
    ctx.fillText("Join a Room", dialogX + dialogWidth / 2, dialogY + 40);

    // Close button
    ctx.fillStyle = "#555";
    ctx.fillRect(dialogX + dialogWidth - 50, dialogY + 10, 40, 30);
    ctx.strokeStyle = "white";
    ctx.strokeRect(dialogX + dialogWidth - 50, dialogY + 10, 40, 30);
    ctx.fillStyle = "white";
    ctx.font = "20px 'Lexend Mega'";
    ctx.textAlign = "center";
    ctx.fillText("X", dialogX + dialogWidth - 30, dialogY + 32);

    // Available rooms list
    ctx.font = "16px 'Lexend Mega'";
    ctx.textAlign = "left";
    ctx.fillText("Available Rooms:", dialogX + 50, dialogY + 70);

    if (this.availableRooms.length === 0) {
      ctx.fillText("No rooms available", dialogX + 50, dialogY + 100);
    } else {
      this.availableRooms.forEach((roomId, index) => {
        // Highlight selected room
        if (roomId === this.roomInputValue) {
          ctx.fillStyle = "#555";
          ctx.fillRect(
            dialogX + 50,
            dialogY + 80 + index * 30,
            dialogWidth - 100,
            25
          );
          ctx.fillStyle = "white";
        }

        ctx.fillText(roomId, dialogX + 60, dialogY + 100 + index * 30);
      });
    }

    // Room ID input field
    ctx.fillStyle = "#111";
    ctx.fillRect(dialogX + 50, dialogY + 150, dialogWidth - 100, 30);
    ctx.strokeStyle = "white";
    ctx.strokeRect(dialogX + 50, dialogY + 150, dialogWidth - 100, 30);

    // Input field value
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(
      this.roomInputValue || "Click to enter Room ID",
      dialogX + 60,
      dialogY + 170
    );

    // Join button
    ctx.fillStyle = "#333";
    ctx.fillRect(dialogX + 100, dialogY + 200, 200, 40);
    ctx.strokeStyle = "white";
    ctx.strokeRect(dialogX + 100, dialogY + 200, 200, 40);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Join", dialogX + 200, dialogY + 225);
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean): void {
    if (pressed) {
      if (keyCode === "Escape") {
        if (this.showRoomDialog) {
          this.showRoomDialog = false;
        } else {
          gameDI.changeState(gameDI.menuState);
        }
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
