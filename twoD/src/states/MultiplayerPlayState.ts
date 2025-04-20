import { GameDI, GameState } from "./GameState";
import { context } from "../main";
import NetworkManager, {
  GameState as NetworkGameState,
  Players,
  BallData,
} from "../networkManager";
import V2 from "../v2";
import { PADDLE_WIDTH, WALL_THICKNESS, PADDLE_HEIGHT, RADIUS } from "../main";

export class MultiplayerPlayState implements GameState {
  private lastTimestamp: number = 0;
  private networkManager: NetworkManager;
  private gameDI: GameDI | null = null;
  private ballVelocity: V2 = new V2(300, 300);
  private gameStarted: boolean = false;
  private lastBallUpdate: number = 0;
  private readonly BALL_SYNC_INTERVAL: number = 0.05; // Sync every 50ms
  private playerDisconnected: boolean = false;

  constructor() {
    this.networkManager = NetworkManager.Instance;
  }

  enter(gameDI: GameDI) {
    this.gameDI = gameDI;

    // Initialize ball position
    if (this.gameDI.ball) {
      this.gameDI.ball.position = new V2(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
    }

    // Set up network callbacks
    this.networkManager.setGameStateCallback(this.handleGameState.bind(this));
    this.networkManager.setPlayerPositionsCallback(
      this.handlePlayerPositions.bind(this)
    );
    this.networkManager.setGameStartCallback(this.handleGameStart.bind(this));
    this.networkManager.setBallSyncCallback(this.handleBallSync.bind(this));
    this.networkManager.setPlayerDisconnectedCallback(() => {
      this.addDisconnectMessage();
    });

    this.startLoop();
  }

  private handleGameStart(started: boolean) {
    this.gameStarted = started;
    if (started && this.gameDI?.ball) {
      // Reset ball to center
      this.gameDI.ball.position = new V2(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
      this.ballVelocity = new V2(300, 300);
    }
  }

  private handleBallSync(data: BallData) {
    if (!this.gameDI?.ball || this.networkManager.playerIsFirst) return;

    // Only non-host players update their ball state from network
    this.gameDI.ball.position = new V2(data.x, data.y);
    this.ballVelocity = new V2(data.velocityX, data.velocityY);
  }

  exit() {
    this.stopLoop();
  }

  private handleGameState(state: NetworkGameState) {
    if (!this.gameDI) return;

    const position = new V2(
      state.isFirstPlayer
        ? PADDLE_WIDTH - WALL_THICKNESS
        : window.innerWidth - PADDLE_WIDTH - WALL_THICKNESS,
      state.position.y
    );

    if (state.isFirstPlayer) {
      this.gameDI.player_one.position = position;
    } else {
      this.gameDI.player_two.position = position;
    }

    this.gameStarted = state.gameStarted;
  }

  private handlePlayerPositions(players: Players) {
    if (!this.gameDI) return;

    if (players.player1) {
      this.gameDI.player_one.position = new V2(
        PADDLE_WIDTH - WALL_THICKNESS,
        players.player1.y
      );
    }
    if (players.player2) {
      this.gameDI.player_two.position = new V2(
        window.innerWidth - PADDLE_WIDTH - WALL_THICKNESS,
        players.player2.y
      );
    }
  }

  private checkWallCollision() {
    if (!this.gameDI?.ball) return;

    // Top wall collision
    if (this.gameDI.ball.position.y - RADIUS < WALL_THICKNESS) {
      this.gameDI.ball.position = new V2(
        this.gameDI.ball.position.x,
        WALL_THICKNESS + RADIUS
      );
      this.ballVelocity = new V2(this.ballVelocity.x, -this.ballVelocity.y);
    }

    // Bottom wall collision
    if (
      this.gameDI.ball.position.y + RADIUS >
      window.innerHeight - WALL_THICKNESS
    ) {
      this.gameDI.ball.position = new V2(
        this.gameDI.ball.position.x,
        window.innerHeight - WALL_THICKNESS - RADIUS
      );
      this.ballVelocity = new V2(this.ballVelocity.x, -this.ballVelocity.y);
    }
  }

  private checkPaddleCollision() {
    if (!this.gameDI?.ball) return;

    const ball = this.gameDI.ball;
    const p1 = this.gameDI.player_one;
    const p2 = this.gameDI.player_two;

    // Check collision with left paddle (player 1)
    if (
      ball.position.x - RADIUS < p1.position.x + PADDLE_WIDTH &&
      ball.position.x + RADIUS > p1.position.x &&
      ball.position.y + RADIUS > p1.position.y - PADDLE_HEIGHT / 2 &&
      ball.position.y - RADIUS < p1.position.y + PADDLE_HEIGHT / 2
    ) {
      ball.position = new V2(
        p1.position.x + PADDLE_WIDTH + RADIUS,
        ball.position.y
      );
      this.ballVelocity = new V2(
        -1.1 * this.ballVelocity.x,
        this.ballVelocity.y + (ball.position.y - p1.position.y) * 2
      );
    }

    // Check collision with right paddle (player 2)
    if (
      ball.position.x + RADIUS > p2.position.x &&
      ball.position.x - RADIUS < p2.position.x + PADDLE_WIDTH &&
      ball.position.y + RADIUS > p2.position.y - PADDLE_HEIGHT / 2 &&
      ball.position.y - RADIUS < p2.position.y + PADDLE_HEIGHT / 2
    ) {
      ball.position = new V2(p2.position.x - RADIUS, ball.position.y);
      this.ballVelocity = new V2(
        -1.1 * this.ballVelocity.x,
        this.ballVelocity.y + (ball.position.y - p2.position.y) * 2
      );
    }
  }

  private checkScoring() {
    if (!this.gameDI?.ball) return;

    // Ball went past left paddle
    if (this.gameDI.ball.position.x < 0) {
      // Reset ball to center
      this.gameDI.ball.position = new V2(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
      this.ballVelocity = new V2(300, 300);
    }

    // Ball went past right paddle
    if (this.gameDI.ball.position.x > window.innerWidth) {
      // Reset ball to center
      this.gameDI.ball.position = new V2(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
      this.ballVelocity = new V2(-300, 300);
    }
  }

  update(dt: number) {
    if (!this.gameDI) return;

    // Update player positions based on input
    if (this.networkManager.playerIsFirst) {
      if (this.gameDI.pressedKeys.has("KeyW")) {
        this.gameDI.player_one.position = this.gameDI.player_one.position.add(
          new V2(0, -300 * dt)
        );
        this.networkManager.sendPlayerMove(this.gameDI.player_one.position.y);
      }
      if (this.gameDI.pressedKeys.has("KeyS")) {
        this.gameDI.player_one.position = this.gameDI.player_one.position.add(
          new V2(0, 300 * dt)
        );
        this.networkManager.sendPlayerMove(this.gameDI.player_one.position.y);
      }
    } else {
      if (this.gameDI.pressedKeys.has("KeyW")) {
        this.gameDI.player_two.position = this.gameDI.player_two.position.add(
          new V2(0, -300 * dt)
        );
        this.networkManager.sendPlayerMove(this.gameDI.player_two.position.y);
      }
      if (this.gameDI.pressedKeys.has("KeyS")) {
        this.gameDI.player_two.position = this.gameDI.player_two.position.add(
          new V2(0, 300 * dt)
        );
        this.networkManager.sendPlayerMove(this.gameDI.player_two.position.y);
      }
    }

    // Only update ball if game has started
    if (this.gameStarted && this.gameDI.ball) {
      this.gameDI.ball.position = this.gameDI.ball.position.add(
        this.ballVelocity.scaler(dt)
      );

      // Check collisions
      this.checkWallCollision();
      this.checkPaddleCollision();
      this.checkScoring();

      // Only the first player (host) sends ball updates
      if (this.networkManager.playerIsFirst) {
        this.lastBallUpdate += dt;
        if (this.lastBallUpdate >= this.BALL_SYNC_INTERVAL) {
          this.networkManager.sendBallUpdate({
            x: this.gameDI.ball.position.x,
            y: this.gameDI.ball.position.y,
            velocityX: this.ballVelocity.x,
            velocityY: this.ballVelocity.y,
          });
          this.lastBallUpdate = 0;
        }
      }
    }
  }

  render(context: CanvasRenderingContext2D) {
    if (!this.gameDI) return;

    // Clear screen
    context.fillStyle = "black";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw walls
    context.fillStyle = "white";
    // Top wall
    context.fillRect(0, 0, context.canvas.width, WALL_THICKNESS);
    // Bottom wall
    context.fillRect(
      0,
      context.canvas.height - WALL_THICKNESS,
      context.canvas.width,
      WALL_THICKNESS
    );

    // Draw center line
    context.setLineDash([5, 15]);
    context.beginPath();
    context.moveTo(context.canvas.width / 2, 0);
    context.lineTo(context.canvas.width / 2, context.canvas.height);
    context.strokeStyle = "white";
    context.stroke();
    context.setLineDash([]);

    // Draw game elements
    this.gameDI.player_one.draw(context);
    this.gameDI.player_two.draw(context);
    if (this.gameDI.ball) {
      this.gameDI.ball.draw(context);
    }

    // Display room ID if available
    const roomId = this.networkManager.roomId;
    if (roomId) {
      context.fillStyle = "white";
      context.font = "16px Arial";
      context.textAlign = "left";
      context.fillText(`Room: ${roomId}`, 20, 30);
    }

    // Draw waiting message if game hasn't started
    if (!this.gameStarted) {
      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);

      context.fillStyle = "white";
      context.font = "24px Arial";
      context.textAlign = "center";

      if (this.networkManager.roomId) {
        context.fillText(
          "Waiting for second player...",
          context.canvas.width / 2,
          context.canvas.height / 2 - 15
        );
        context.fillText(
          `Share Room ID: ${this.networkManager.roomId}`,
          context.canvas.width / 2,
          context.canvas.height / 2 + 25
        );
      } else {
        context.fillText(
          "Connecting to server...",
          context.canvas.width / 2,
          context.canvas.height / 2
        );
      }
    }

    // Show player disconnected message
    if (this.playerDisconnected) {
      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);

      context.fillStyle = "white";
      context.font = "24px Arial";
      context.textAlign = "center";
      context.fillText(
        "Other player disconnected",
        context.canvas.width / 2,
        context.canvas.height / 2 - 15
      );
      context.fillText(
        "Returning to lobby in 3 seconds...",
        context.canvas.width / 2,
        context.canvas.height / 2 + 25
      );
    }
  }

  handleInput(gameDI: GameDI, keyCode: string, pressed: boolean) {
    // Allow returning to lobby with Escape key
    if (pressed && keyCode === "Escape") {
      this.networkManager.disconnect();
      gameDI.changeState(gameDI.lobbyState);
    }
  }

  startLoop() {
    const step = (timestamp: number) => {
      if (this.lastTimestamp === 0) {
        this.lastTimestamp = timestamp;
      }

      const dt = (timestamp - this.lastTimestamp) * 0.001;
      this.lastTimestamp = timestamp;

      this.update(dt);
      this.render(context);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  stopLoop() {
    // Cleanup code here
  }

  // Add a message when the other player disconnects
  private addDisconnectMessage() {
    if (!this.gameDI) return;
    // Player has disconnected, game will end soon
    this.gameStarted = false;
    this.playerDisconnected = true;

    // Return to lobby after 3 seconds
    setTimeout(() => {
      if (this.gameDI) {
        this.gameDI.changeState(this.gameDI.lobbyState);
      }
    }, 3000);
  }
}
