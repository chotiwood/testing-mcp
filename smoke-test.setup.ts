// jsdom has no canvas backend; lottie-web probes a 2D context at import time
// purely for feature-detection. A minimal stub object is enough to satisfy it.
const fakeContext2D = new Proxy(
  {},
  { get: () => () => undefined, set: () => true },
) as unknown as CanvasRenderingContext2D;
HTMLCanvasElement.prototype.getContext = (() =>
  fakeContext2D) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// jsdom has no ResizeObserver; ApexCharts (used by BTBarChart/BTLineChart) only
// needs the constructor to exist so it can register a (no-op) resize listener.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
