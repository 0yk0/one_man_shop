import "@testing-library/jest-dom/vitest";

// Mock IntersectionObserver (used by framer-motion)
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock scrollTo
Object.defineProperty(globalThis, "scrollTo", {
  writable: true,
  value: () => {},
});
