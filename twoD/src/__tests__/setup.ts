// Mock canvas
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => ({
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    fillStyle: "",
    fillRect: () => {},
  }),
};

// Mock window
global.window = {
  ...global.window,
  innerWidth: 800,
  innerHeight: 600,
  setTimeout: (callback: Function, time: number) => setTimeout(callback, time),
} as any;

// Mock document
global.document = {
  ...global.document,
  getElementById: () => mockCanvas,
} as any;

export { mockCanvas };
