import { describe, it, expect } from "vitest";
import V2 from "../v2";

describe("V2", () => {
  it("should create a vector with x and y coordinates", () => {
    const vector = new V2(1, 2);
    expect(vector.x).toBe(1);
    expect(vector.y).toBe(2);
  });

  it("should add two vectors", () => {
    const v1 = new V2(1, 2);
    const v2 = new V2(3, 4);
    const result = v1.add(v2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it("should multiply vector by scalar", () => {
    const vector = new V2(2, 3);
    const result = vector.scaler(2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });
});
