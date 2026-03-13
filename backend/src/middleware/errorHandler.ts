import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const details = err.flatten().fieldErrors;
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    } satisfies ApiErrorBody);
    return;
  }

  if (err instanceof Error && err.message === 'Unauthorized') {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' } satisfies ApiErrorBody);
    return;
  }

  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: isProd ? 'Internal server error' : (err instanceof Error ? err.message : 'Unknown error'),
    code: 'INTERNAL_ERROR',
    ...(isProd ? {} : { details: err instanceof Error ? err.stack : undefined }),
  } satisfies ApiErrorBody);
}
