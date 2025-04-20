import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Enable CORS for Express
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

interface PlayerData {
  socketId: string;
  x: number;
  y: number;
  isFirstPlayer: boolean;
}

interface BallData {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

let players: PlayerData[] = [];
let ballData: BallData | null = null;
let gameStarted = false;

// Constants for paddle positions
const PADDLE_WIDTH = 20;
const WALL_THICKNESS = 6;
let WINDOW_HEIGHT = 800; // Default height
let WINDOW_WIDTH = 1024; // Default width

function getFormattedPlayers() {
  const player1 = players.find((p) => p.isFirstPlayer);
  const player2 = players.find((p) => !p.isFirstPlayer);
  return { player1, player2 };
}

function startGame() {
  if (players.length === 2 && !gameStarted) {
    gameStarted = true;
    ballData = {
      x: 0, // These will be set by the first player
      y: 0,
      velocityX: 300,
      velocityY: 300,
    };
    io.emit("game-start", { gameStarted: true });
  }
}

// Basic Express route
app.get("/", (req, res) => {
  res.send("Pong Game Server Running");
});

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-game", (initialPosition: { x: number; y: number }) => {
    // Check if this socket is already a player
    const existingPlayer = players.find((p) => p.socketId === socket.id);
    if (existingPlayer) {
      console.log("Player already in game:", socket.id);
      return;
    }

    // Check if game is full
    if (players.length >= 2) {
      console.log("Game is full, rejecting connection");
      socket.emit("game-full");
      return;
    }

    // Determine if this is the first player
    const isFirstPlayer = players.length === 0;

    const playerData: PlayerData = {
      socketId: socket.id,
      x: initialPosition.x,
      y: initialPosition.y,
      isFirstPlayer,
    };

    // Store player data
    players.push(playerData);
    console.log(`Added player ${socket.id}, isFirst: ${isFirstPlayer}`);
    console.log("Current players:", players);

    // Send initial game state to the new player
    socket.emit("game-state", {
      position: initialPosition,
      isFirstPlayer,
      gameStarted,
    });

    // Broadcast current players to everyone
    const formattedPlayers = getFormattedPlayers();
    io.emit("player-positions", formattedPlayers);

    console.log(
      `Player ${isFirstPlayer ? "ONE" : "TWO"} joined. Position:`,
      initialPosition
    );
    console.log("Total players:", players.length);
    console.log("Broadcast players state:", formattedPlayers);

    // Check if we should start the game
    startGame();
  });

  socket.on("ball-update", (data: BallData) => {
    if (gameStarted) {
      ballData = data;
      socket.broadcast.emit("ball-sync", ballData);
    }
  });

  socket.on("player-move", (data: { isFirstPlayer: boolean; y: number }) => {
    const player = players.find((p) => p.socketId === socket.id);
    if (player) {
      player.y = data.y;
      // Broadcast the updated positions to all players
      io.emit("player-positions", getFormattedPlayers());
    }
  });

  socket.on("disconnect", () => {
    const wasPlayer = players.find((p) => p.socketId === socket.id);
    if (wasPlayer) {
      console.log(
        `Player ${wasPlayer.isFirstPlayer ? "ONE" : "TWO"} disconnected:`,
        socket.id
      );
    }

    // Remove the disconnected player
    players = players.filter((p) => p.socketId !== socket.id);
    console.log("Remaining players:", players.length);

    // Reset game state
    if (players.length < 2) {
      gameStarted = false;
      ballData = null;
    }

    // Notify remaining players
    io.emit("player-positions", getFormattedPlayers());
    io.emit("game-start", { gameStarted: false });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
