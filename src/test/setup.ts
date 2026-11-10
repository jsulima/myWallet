import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver and scrollTo for Radix UI components
if (typeof window !== 'undefined') {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
  });
}
