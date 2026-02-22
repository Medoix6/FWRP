/**
 * API Error handling utilities
 */

import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: ApiError): ApiResponse {
  return {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
    },
    timestamp: new Date().toISOString(),
  };
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    const response = createErrorResponse(error);
    const nextResponse = NextResponse.json(response, { status: error.statusCode });
    
    if (error instanceof RateLimitError) {
      nextResponse.headers.set('Retry-After', error.retryAfter.toString());
    }
    
    return nextResponse;
  }

  if (error instanceof Error) {
    const response = createErrorResponse(
      new ApiError(500, error.message, 'INTERNAL_SERVER_ERROR')
    );
    return NextResponse.json(response, { status: 500 });
  }

  const response = createErrorResponse(
    new ApiError(500, 'An unexpected error occurred', 'INTERNAL_SERVER_ERROR')
  );
  return NextResponse.json(response, { status: 500 });
}
