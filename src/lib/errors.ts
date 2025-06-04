/**
 * Base error class for all Companies House MCP errors
 */
export class CompaniesHouseError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'CompaniesHouseError';
  }

  /**
   * Convert to a user-friendly error message for MCP tools
   */
  toUserMessage(): string {
    return `Error: ${this.message}`;
  }
}

/**
 * Error thrown when the API returns an error response
 */
export class APIError extends CompaniesHouseError {
  constructor(
    message: string,
    status: number = 500,
    code: string = 'API_ERROR'
  ) {
    super(message, code, status);
    this.name = 'APIError';
  }

  static fromStatus(status: number): APIError {
    let message = 'An error occurred while accessing the Companies House API';
    let code = 'API_ERROR';

    switch (status) {
      case 401:
        message = 'Invalid Companies House API key';
        code = 'INVALID_API_KEY';
        break;
      case 404:
        message = 'Resource not found';
        code = 'NOT_FOUND';
        break;
      case 429:
        message = 'Rate limit exceeded. Please try again later';
        code = 'RATE_LIMIT_EXCEEDED';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'Companies House API service error';
        code = 'SERVICE_ERROR';
        break;
    }

    return new APIError(message, status, code);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends CompaniesHouseError {
  constructor(
    message: string,
    public readonly fieldName?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }

  toUserMessage(): string {
    if (this.fieldName) {
      return `Invalid input for '${this.fieldName}': ${this.message}`;
    }
    return `Invalid input: ${this.message}`;
  }
}

/**
 * Error thrown when a required resource is not found
 */
export class NotFoundError extends CompaniesHouseError {
  constructor(
    message: string,
    public readonly resource: string,
    public readonly identifier?: string
  ) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }

  toUserMessage(): string {
    if (this.identifier) {
      return `${this.resource} '${this.identifier}' not found`;
    }
    return `${this.resource} not found`;
  }
}

/**
 * Error thrown when rate limiting is hit
 */
export class RateLimitError extends CompaniesHouseError {
  constructor(
    message: string = 'Rate limit exceeded. Please try again later'
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown for configuration issues
 */
export class ConfigurationError extends CompaniesHouseError {
  constructor(
    message: string
  ) {
    super(message, 'CONFIGURATION_ERROR', 500);
    this.name = 'ConfigurationError';
  }
}
