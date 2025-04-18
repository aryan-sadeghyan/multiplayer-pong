import V2 from "./v2";
import Player from "./player";
import Ball from "./ball";

export default class GameData {
  players: Map<string, Player>;
  ball: Ball;
  scores: Map<string, number>;
  constructor() {
    this.players = new Map();
    this.ball = new Ball();
    this.scores = new Map();
  }

  addPlayer(id: string, position: V2) {
    const player = new Player(id, position);
    this.players.set(id, player);
    this.scores.set(id, 0);

    return player;
  }

  updatePlayerPosition(id: string, direction: V2, dt: number) {
    const player = this.players.get(id);
    if (player) {
      player.update(direction, dt);
    }
  }

  serialize() {
    const playerData: any = {};
    this.players.forEach((player, id) => {
      playerData[id] = {
        x: player.position.x,
        y: player.position.y,
      };
    });
    const scores: any = {};
    this.scores.forEach((score, id) => {
      scores[id] = score;
    });

    return JSON.stringify({
      players: playerData,
      ball: {
        x: this.ball.getPosition().x,
        y: this.ball.getPosition().y,
      },
      scores: scores,
    });
  }
}
