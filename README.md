# Multiplayer Pong

A minimalist multiplayer implementation of Pong with room-based matchmaking.

## Tech Stack

- **Client**: TypeScript, Canvas API, Socket.io
- **Server**: Node.js, Express, Socket.io

## Quick Start

### Server

```bash
cd server
npm install
npm run dev
```

### Client

```bash
cd twoD
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

- Create/join game rooms with unique IDs
- Real-time multiplayer over WebSockets
- Paddle physics and ball collision

## Controls

- W/S keys: Move paddle up/down
- ESC: Return to lobby

## License

MIT - Feel free to use, modify and distribute.
