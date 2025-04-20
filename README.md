# Multiplayer Pong Game

A modern implementation of the classic Pong game with real-time multiplayer functionality. Play against friends over the internet with a room-based system for easy matchmaking.

![Pong Game](https://raw.githubusercontent.com/aryan-sadeghyan/multiplayer-pong/main/screenshot.png)

## Features

- **Classic Pong Gameplay**: The nostalgic arcade experience reimagined
- **Multiplayer Support**: Play with friends in real-time over the internet
- **Room System**: Create or join game rooms with unique IDs
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Physics**: Realistic ball movement and collision detection
- **Visual Effects**: Modern visuals with clean aesthetics

## Tech Stack

### Client

- TypeScript
- Canvas API for rendering
- Vite for bundling and development
- Socket.io client for real-time communication

### Server

- Node.js
- Express
- Socket.io for WebSocket communication
- UUID for generating unique room IDs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/aryan-sadeghyan/multiplayer-pong.git
   cd multiplayer-pong
   ```

2. Install dependencies for both client and server:

   ```
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../twoD
   npm install
   ```

### Running the Game

1. Start the server:

   ```
   cd server
   npm run dev
   ```

2. In a new terminal, start the client:

   ```
   cd twoD
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## How to Play

1. From the main menu, select "custom multiplayer"
2. In the lobby, you can:
   - Create a new room: Click "Create Room"
   - Join an existing room: Click "Join Room" and enter a room ID
   - Refresh the room list: Click "Refresh Rooms"
3. Once in a game:
   - Player 1 (left paddle): Use W/S keys to move up/down
   - Player 2 (right paddle): Use W/S keys to move up/down
   - Press ESC to exit the game and return to the lobby

## Game Rules

- The ball bounces off the top and bottom walls and the paddles
- If the ball passes your paddle, the opponent scores a point
- The ball increases in speed slightly with each paddle hit
- The ball's direction changes based on where it hits the paddle

## Development

### Project Structure

- `/twoD` - Client-side code
  - `/src` - Source code
    - `/states` - Game state management
    - `/networkManager.ts` - Client-side networking
- `/server` - Server-side code
  - `server.ts` - WebSocket server implementation

### Building for Production

1. Build the client:

   ```
   cd twoD
   npm run build
   ```

2. Build the server:
   ```
   cd server
   npm run build
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Pong game by Atari
- Socket.io for making real-time communication easy
- The TypeScript team for an amazing language
