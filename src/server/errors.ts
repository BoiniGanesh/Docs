export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403);
  }
}

/** Also used when a user lacks read access, so we don't leak document existence. */
export class NotFoundError extends AppError {
  constructor(message = "Document not found.") {
    super(message, 404);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string) {
    super(message, 413);
  }
}

export class UnsupportedMediaError extends AppError {
  constructor(message: string) {
    super(message, 415);
  }
}
