import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(request, response) {
  response.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `No route matches ${request.method} ${request.originalUrl}.` },
  });
}

export function errorHandler(error, request, response, next) { // eslint-disable-line no-unused-vars
  if (error instanceof ZodError) {
    return response.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'The request data is invalid.', details: error.flatten() },
    });
  }
  const status = error.status || 500;
  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(error);
  return response.status(status).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'An unexpected server error occurred.' : error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
