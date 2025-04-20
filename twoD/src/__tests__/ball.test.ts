import { describe, it, expect, beforeEach } from "vitest";
import Ball from "../ball";
import V2 from "../v2";

describe("Ball", () => {
  let ball: Ball;

  beforeEach(() => {
    ball = new Ball();
  });

  it("should initialize with correct default position", () => {
    expect(ball.position.x).toBe(800 / 2);
    expect(ball.position.y).toBe(600 / 2);
  });

  it("should reset to center position", () => {
    ball.position = new V2(100, 100);
    ball.reset();
    expect(ball.position.x).toBe(800 / 2);
    expect(ball.position.y).toBe(600 / 2);
  });

  it("should detect wall collisions", () => {
    // Top wall collision
    ball.position = new V2(400, 0);
    expect(ball.checkWall()).toBe(true);

    // Bottom wall collision
    ball.position = new V2(400, 600);
    expect(ball.checkWall()).toBe(true);

    // No collision
    ball.position = new V2(400, 300);
    expect(ball.checkWall()).toBe(false);
  });

  it("should detect paddle collisions", () => {
    const paddlePos = new V2(50, 300);

    // Ball touching paddle
    ball.position = new V2(70, 300);
    expect(ball.checkPaddle(paddlePos)).toBe(true);

    // Ball away from paddle
    ball.position = new V2(200, 300);
    expect(ball.checkPaddle(paddlePos)).toBe(false);
  });

  it("should detect scoring", () => {
    // Ball past left boundary
    ball.position = new V2(-10, 300);
    expect(ball.checkScore()).toBe("right");

    // Ball past right boundary
    ball.position = new V2(810, 300);
    expect(ball.checkScore()).toBe("left");

    // Ball in play
    ball.position = new V2(400, 300);
    expect(ball.checkScore()).toBe(null);
  });
});
