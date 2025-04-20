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

export interface RoomInfo {
  roomId: string;
  isFirstPlayer: boolean;
}

export default class NetworkManager {
  private static instance: NetworkManager = new NetworkManager();
  private socket: Socket | null = null;
  private isFirstPlayer: boolean = false;
  private currentRoomId: string | null = null;
  private onGameState: ((data: GameState) => void) | null = null;
  private onPlayerPositions: ((data: Players) => void) | null = null;
  private onGameStart: ((started: boolean) => void) | null = null;
  private onBallSync: ((data: BallData) => void) | null = null;
  private onRoomCreated: ((data: RoomInfo) => void) | null = null;
  private onRoomJoined: ((data: RoomInfo) => void) | null = null;
  private onAvailableRooms: ((rooms: string[]) => void) | null = null;
  private onError: ((error: { message: string }) => void) | null = null;
  private onPlayerDisconnected: (() => void) | null = null;

  private constructor() {}

  public static get Instance(): NetworkManager {
    return NetworkManager.instance;
  }

  connect(): void {
    if (this.socket) {
      console.log("Already connected");
      return;
    }

    this.socket = io("http://localhost:3000");

    this.socket.on("connect", () => {
      console.log("Connected to server");
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

    this.socket.on("room-created", (data: RoomInfo) => {
      console.log("Room created:", data);
      this.currentRoomId = data.roomId;
      this.isFirstPlayer = data.isFirstPlayer;
      if (this.onRoomCreated) {
        this.onRoomCreated(data);
      }
    });

    this.socket.on("room-joined", (data: RoomInfo) => {
      console.log("Room joined:", data);
      this.currentRoomId = data.roomId;
      this.isFirstPlayer = data.isFirstPlayer;
      if (this.onRoomJoined) {
        this.onRoomJoined(data);
      }
    });

    this.socket.on("available-rooms", (rooms: string[]) => {
      console.log("Available rooms:", rooms);
      if (this.onAvailableRooms) {
        this.onAvailableRooms(rooms);
      }
    });

    this.socket.on("error", (error: { message: string }) => {
      console.error("Server error:", error);
      if (this.onError) {
        this.onError(error);
      }
    });

    this.socket.on("player-disconnected", () => {
      console.log("Other player disconnected");
      if (this.onPlayerDisconnected) {
        this.onPlayerDisconnected();
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

  createRoom(initialPosition: PlayerPosition): void {
    if (!this.socket) {
      console.error("Not connected to server");
      return;
    }
    this.socket.emit("create-room", initialPosition);
  }

  joinRoom(roomId: string, initialPosition: PlayerPosition): void {
    if (!this.socket) {
      console.error("Not connected to server");
      return;
    }
    this.socket.emit("join-room", { roomId, initialPosition });
  }

  getAvailableRooms(): void {
    if (!this.socket) {
      console.error("Not connected to server");
      return;
    }
    this.socket.emit("get-available-rooms");
  }

  sendPlayerMove(y: number): void {
    if (!this.socket) return;
    this.socket.emit("player-move", {
      isFirstPlayer: this.isFirstPlayer,
      y,
    });
  }

  sendBallUpdate(ballData: BallData): void {
    if (!this.socket) return;
    this.socket.emit("ball-update", ballData);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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

  setRoomCreatedCallback(callback: (data: RoomInfo) => void): void {
    this.onRoomCreated = callback;
  }

  setRoomJoinedCallback(callback: (data: RoomInfo) => void): void {
    this.onRoomJoined = callback;
  }

  setAvailableRoomsCallback(callback: (rooms: string[]) => void): void {
    this.onAvailableRooms = callback;
  }

  setErrorCallback(callback: (error: { message: string }) => void): void {
    this.onError = callback;
  }

  setPlayerDisconnectedCallback(callback: () => void): void {
    this.onPlayerDisconnected = callback;
  }

  get playerIsFirst(): boolean {
    return this.isFirstPlayer;
  }

  get roomId(): string | null {
    return this.currentRoomId;
  }
}
