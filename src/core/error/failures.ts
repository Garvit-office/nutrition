// src/core/error/failures.ts
export abstract class Failure {
  abstract readonly code: string;

  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

export class ServerFailure extends Failure {
  readonly code = 'SERVER_FAILURE';
  constructor(message = 'The server returned an error.', cause?: unknown) {
    super(message, cause);
  }
}

export class CacheFailure extends Failure {
  readonly code = 'CACHE_FAILURE';
  constructor(message = 'Failed to read or write local cache.', cause?: unknown) {
    super(message, cause);
  }
}

export class NetworkFailure extends Failure {
  readonly code = 'NETWORK_FAILURE';
  constructor(message = 'No network connection is available.', cause?: unknown) {
    super(message, cause);
  }
}

export class ValidationFailure extends Failure {
  readonly code = 'VALIDATION_FAILURE';
  constructor(message = 'The provided data is invalid.', cause?: unknown) {
    super(message, cause);
  }
}

export class TimeoutFailure extends Failure {
  readonly code = 'TIMEOUT_FAILURE';
  constructor(message = 'The operation timed out.', cause?: unknown) {
    super(message, cause);
  }
}

export class PermissionFailure extends Failure {
  readonly code = 'PERMISSION_FAILURE';
  constructor(message = 'Required permission was not granted.', cause?: unknown) {
    super(message, cause);
  }
}

export type AppFailure =
  | ServerFailure
  | CacheFailure
  | NetworkFailure
  | ValidationFailure
  | TimeoutFailure
  | PermissionFailure;