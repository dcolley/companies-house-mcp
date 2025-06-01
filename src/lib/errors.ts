/**
 * Custom error class for Companies House API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
} 