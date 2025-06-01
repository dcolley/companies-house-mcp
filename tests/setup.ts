// Jest setup file for Companies House MCP server tests

// Set environment variables for testing
process.env.NODE_ENV = 'test';

// Mock console.warn and console.error for cleaner test output
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  // Reset console mocks before each test
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(10000);

// Suppress specific warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('ExperimentalWarning') || message.includes('punycode'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
}; 