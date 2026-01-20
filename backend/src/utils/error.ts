export class throwAppError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class BadRequest extends throwAppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class Unauthorized extends throwAppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class NotFound extends throwAppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class Conflict extends throwAppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerError extends throwAppError {
  constructor(message: string) {
    super(message, 500);
  }
}
