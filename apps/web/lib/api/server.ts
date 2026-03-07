import { NextResponse } from 'next/server';

export interface ApiErrorShape {
  ok: false;
  error: string;
  code?: string;
  requestId?: string;
  details?: unknown;
}

export interface ApiOkShape<T> {
  ok: true;
  data: T;
  requestId?: string;
}

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, options?: { code?: string; details?: unknown }) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getRequestId(request?: Request): string {
  return request?.headers.get('x-request-id') ?? randomId();
}

export function apiOk<T>(data: T, request?: Request, init?: ResponseInit): NextResponse<ApiOkShape<T>> {
  return NextResponse.json(
    { ok: true, data, requestId: getRequestId(request) },
    { status: 200, ...init },
  );
}

export function apiError(
  message: string,
  status = 500,
  request?: Request,
  options?: { code?: string; details?: unknown },
): NextResponse<ApiErrorShape> {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      code: options?.code,
      details: options?.details,
      requestId: getRequestId(request),
    },
    { status },
  );
}

export function logApiError(route: string, error: unknown, request?: Request): void {
  const requestId = getRequestId(request);
  if (error instanceof HttpError) {
    console.error(`[API:${route}] ${error.status} ${error.message} (${requestId})`, {
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`[API:${route}] 500 ${error.message} (${requestId})`, { stack: error.stack });
    return;
  }

  console.error(`[API:${route}] 500 Unknown error (${requestId})`, { error });
}

export function toApiErrorResponse(route: string, error: unknown, request?: Request): NextResponse<ApiErrorShape> {
  logApiError(route, error, request);

  if (error instanceof HttpError) {
    return apiError(error.message, error.status, request, {
      code: error.code,
      details: error.details,
    });
  }

  return apiError('Internal server error', 500, request, { code: 'INTERNAL_ERROR' });
}
