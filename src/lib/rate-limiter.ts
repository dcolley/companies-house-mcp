import { RateLimitError } from './errors.js';

/**
 * Simple rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillInterval: number;
  private readonly tokensPerRequest: number;

  constructor(maxTokens: number, refillInterval: number, tokensPerRequest: number = 1) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillInterval = refillInterval;
    this.tokensPerRequest = tokensPerRequest;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const refillRate = this.maxTokens / this.refillInterval;
    const tokensToAdd = Math.floor(timePassed * refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async checkLimit(): Promise<void> {
    this.refillTokens();

    if (this.tokens < this.tokensPerRequest) {
      const timeToWait = Math.ceil((this.tokensPerRequest - this.tokens) / (this.maxTokens / this.refillInterval));
      const waitTimeMs = Math.max(100, timeToWait);
      
      throw new RateLimitError(
        `Rate limit exceeded. Please wait ${waitTimeMs}ms before retrying.`
      );
    }

    this.tokens -= this.tokensPerRequest;
  }
  
  /**
   * Get the current number of available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }
  
  /**
   * Get the estimated time until the specified number of tokens become available
   */
  getWaitTimeMs(requiredTokens: number = this.tokensPerRequest): number {
    this.refillTokens();
    
    if (this.tokens >= requiredTokens) {
      return 0;
    }
    
    const tokensNeeded = requiredTokens - this.tokens;
    const refillRate = this.maxTokens / this.refillInterval; // tokens per ms
    return Math.ceil(tokensNeeded / refillRate);
  }
}
