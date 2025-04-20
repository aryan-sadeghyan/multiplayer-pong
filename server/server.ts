import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

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

interface Room {
  id: string;
  players: PlayerData[];
  ballData: BallData | null;
  gameStarted: boolean;
}

// Store all active rooms
let rooms: Map<string, Room> = new Map();

// Find available rooms (rooms with only one player)
function getAvailableRooms(): string[] {
  const availableRooms: string[] = [];
  rooms.forEach((room, id) => {
    if (room.players.length === 1) {
      availableRooms.push(id);
    }
  });
  return availableRooms;
}

// Get formatted players for a room
function getFormattedPlayers(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return { player1: null, player2: null };

  const player1 = room.players.find((p) => p.isFirstPlayer);
  const player2 = room.players.find((p) => !p.isFirstPlayer);
  return { player1, player2 };
}

// Start a game when both players have joined
function startGame(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.players.length !== 2 || room.gameStarted) return;

  room.gameStarted = true;
  room.ballData = {
    x: 0,
    y: 0,
    velocityX: 300,
    velocityY: 300,
  };
  io.to(roomId).emit("game-start", { gameStarted: true });
}

// Basic Express route
app.get("/", (req, res) => {
  res.send("Pong Game Server Running");
});

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send list of available rooms
  socket.on("get-available-rooms", () => {
    socket.emit("available-rooms", getAvailableRooms());
  });

  // Create a new room
  socket.on("create-room", (initialPosition: { x: number; y: number }) => {
    // Create a new room with a unique ID
    const roomId = uuidv4().substring(0, 6).toUpperCase();

    const newRoom: Room = {
      id: roomId,
      players: [
        {
          socketId: socket.id,
          x: initialPosition.x,
          y: initialPosition.y,
          isFirstPlayer: true,
        },
      ],
      ballData: null,
      gameStarted: false,
    };

    rooms.set(roomId, newRoom);

    // Join the socket to the room
    socket.join(roomId);

    // Store room ID in socket data
    socket.data.roomId = roomId;

    console.log(`Player ${socket.id} created room ${roomId}`);

    // Send room information to the player
    socket.emit("room-created", {
      roomId,
      isFirstPlayer: true,
    });

    // Send initial game state
    socket.emit("game-state", {
      position: initialPosition,
      isFirstPlayer: true,
      gameStarted: false,
    });

    // Broadcast current players to everyone in the room
    io.to(roomId).emit("player-positions", getFormattedPlayers(roomId));
  });

  // Join an existing room
  socket.on(
    "join-room",
    (data: { roomId: string; initialPosition: { x: number; y: number } }) => {
      const { roomId, initialPosition } = data;

      // Check if room exists
      if (!rooms.has(roomId)) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const room = rooms.get(roomId)!;

      // Check if room is full
      if (room.players.length >= 2) {
        socket.emit("error", { message: "Room is full" });
        return;
      }

      // Add player to room
      room.players.push({
        socketId: socket.id,
        x: initialPosition.x,
        y: initialPosition.y,
        isFirstPlayer: false,
      });

      // Join the socket to the room
      socket.join(roomId);

      // Store room ID in socket data
      socket.data.roomId = roomId;

      console.log(`Player ${socket.id} joined room ${roomId}`);

      // Send confirmation to the player
      socket.emit("room-joined", {
        roomId,
        isFirstPlayer: false,
      });

      // Send initial game state
      socket.emit("game-state", {
        position: initialPosition,
        isFirstPlayer: false,
        gameStarted: false,
      });

      // Broadcast current players to everyone in the room
      io.to(roomId).emit("player-positions", getFormattedPlayers(roomId));

      // Start the game now that we have two players
      startGame(roomId);
    }
  );

  // Handle ball updates
  socket.on("ball-update", (data: BallData) => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId)!;
    if (room.gameStarted) {
      room.ballData = data;
      // Broadcast to everyone in the room except sender
      socket.to(roomId).emit("ball-sync", data);
    }
  });

  // Handle player movement
  socket.on("player-move", (data: { isFirstPlayer: boolean; y: number }) => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId)!;
    const player = room.players.find((p) => p.socketId === socket.id);

    if (player) {
      player.y = data.y;
      // Broadcast updated positions to everyone in the room
      io.to(roomId).emit("player-positions", getFormattedPlayers(roomId));
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId)!;

    // Find the player that disconnected
    const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);
    if (playerIndex !== -1) {
      const wasFirstPlayer = room.players[playerIndex].isFirstPlayer;
      console.log(
        `Player ${
          wasFirstPlayer ? "ONE" : "TWO"
        } disconnected from room ${roomId}`
      );

      // Remove the player
      room.players.splice(playerIndex, 1);

      // If there are still players in the room, notify them
      if (room.players.length > 0) {
        room.gameStarted = false;
        room.ballData = null;

        // Notify remaining players
        io.to(roomId).emit("player-positions", getFormattedPlayers(roomId));
        io.to(roomId).emit("game-start", { gameStarted: false });
        io.to(roomId).emit("player-disconnected");
      } else {
        // If no players left, remove the room
        rooms.delete(roomId);
        console.log(`Room ${roomId} removed`);
      }
    }
  });
});

// API endpoint to get list of available rooms
app.get("/rooms", (req, res) => {
  res.json(getAvailableRooms());
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
