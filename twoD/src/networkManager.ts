import { io, Socket } from "socket.io-client";

export interface PlayerPosition {
  x: number;
  y: number;
}

export interface GameState {
  position: PlayerPosition;
  isFirstPlayer: boolean;
  gameStarted: boolean;
}

export interface Players {
  player1?: {
    x: number;
    y: number;
    isFirstPlayer: boolean;
  };
  player2?: {
    x: number;
    y: number;
    isFirstPlayer: boolean;
  };
}

export interface BallData {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export default class NetworkManager {
  private static instance: NetworkManager = new NetworkManager();
  private socket: Socket | null = null;
  private isFirstPlayer: boolean = false;
  private onGameState: ((data: GameState) => void) | null = null;
  private onPlayerPositions: ((data: Players) => void) | null = null;
  private onGameStart: ((started: boolean) => void) | null = null;
  private onBallSync: ((data: BallData) => void) | null = null;

  private constructor() {}

  public static get Instance(): NetworkManager {
    return NetworkManager.instance;
  }

  connect(initialPosition: PlayerPosition): void {
    this.socket = io("http://localhost:3000");

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.socket?.emit("join-game", initialPosition);
    });

    this.socket.on("game-state", (state: GameState) => {
      console.log("Received game state:", state);
      this.isFirstPlayer = state.isFirstPlayer;
      if (this.onGameState) {
        this.onGameState(state);
      }
    });

    this.socket.on("player-positions", (positions: Players) => {
      console.log("Received player positions:", positions);
      if (this.onPlayerPositions) {
        this.onPlayerPositions(positions);
      }
    });

    this.socket.on("game-start", (data: { gameStarted: boolean }) => {
      console.log("Game start status:", data.gameStarted);
      if (this.onGameStart) {
        this.onGameStart(data.gameStarted);
      }
    });

    this.socket.on("ball-sync", (data: BallData) => {
      console.log("Received ball sync:", data);
      if (this.onBallSync) {
        this.onBallSync(data);
      }
    });

    this.socket.on("game-full", () => {
      console.log("Game is full!");
      this.socket?.disconnect();
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }

  sendPlayerMove(y: number): void {
    this.socket?.emit("player-move", {
      isFirstPlayer: this.isFirstPlayer,
      y,
    });
  }

  sendBallUpdate(ballData: BallData): void {
    this.socket?.emit("ball-update", ballData);
  }

  setGameStateCallback(callback: (data: GameState) => void): void {
    this.onGameState = callback;
  }

  setPlayerPositionsCallback(callback: (data: Players) => void): void {
    this.onPlayerPositions = callback;
  }

  setGameStartCallback(callback: (started: boolean) => void): void {
    this.onGameStart = callback;
  }

  setBallSyncCallback(callback: (data: BallData) => void): void {
    this.onBallSync = callback;
  }

  get playerIsFirst(): boolean {
    return this.isFirstPlayer;
  }
}
