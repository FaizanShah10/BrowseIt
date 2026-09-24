export class ConflictError extends Error {
  readonly status = 409 as const;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class BadRequestError extends Error {
  readonly status = 400 as const;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404 as const;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
