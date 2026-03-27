export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(401, message);
  }

  static forbidden(message: string, details?: unknown) {
    return new AppError(403, message, details);
  }

  static notFound(message = "Not found") {
    return new AppError(404, message);
  }

  static tooManyRequests(message = "Rate limit exceeded") {
    return new AppError(429, message);
  }

  static internal(message = "Internal server error") {
    return new AppError(500, message);
  }

  /** Provider (e.g. OpenRouter) rejected the prompt for policy/safety reasons. */
  static contentFilterBlocked(
    message = "Request blocked by provider content policy"
  ) {
    return new AppError(403, message, undefined, "CONTENT_FILTER_BLOCKED");
  }
}
