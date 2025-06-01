import { RateLimiter } from '../../../src/lib/rate-limiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const maxTokens = 5;
  const refillInterval = 1000; // 1 second

  beforeEach(() => {
    rateLimiter = new RateLimiter(maxTokens, refillInterval);
  });

  it('should allow requests within limit', async () => {
    for (let i = 0; i < maxTokens; i++) {
      await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
    }
  });

  it('should reject requests when limit exceeded', async () => {
    for (let i = 0; i < maxTokens; i++) {
      await rateLimiter.checkLimit();
    }

    await expect(rateLimiter.checkLimit()).rejects.toThrow('Rate limit exceeded');
  });

  it('should refill tokens after interval', async () => {
    // Use up all tokens
    for (let i = 0; i < maxTokens; i++) {
      await rateLimiter.checkLimit();
    }

    // Wait for refill
    await new Promise(resolve => setTimeout(resolve, refillInterval));

    // Should be able to make requests again
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
  });

  it('should partially refill tokens based on time passed', async () => {
    // Use up all tokens
    for (let i = 0; i < maxTokens; i++) {
      await rateLimiter.checkLimit();
    }

    // Wait for half the refill interval
    await new Promise(resolve => setTimeout(resolve, refillInterval / 2));

    // Should have half the tokens refilled (2 tokens for maxTokens = 5)
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit()).rejects.toThrow('Rate limit exceeded');
  });
});
