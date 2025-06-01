/**
 * Simple rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillInterval: number;

  constructor(maxTokens: number, refillInterval: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillInterval = refillInterval;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.refillInterval) * this.maxTokens);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async checkLimit(): Promise<void> {
    this.refillTokens();

    if (this.tokens <= 0) {
      const waitTime = Math.ceil(
        ((this.refillInterval / this.maxTokens) * (1 - this.tokens)) * 1000
      );
      throw new Error(`Rate limit exceeded. Please wait ${waitTime}ms before retrying.`);
    }

    this.tokens--;
  }
} 