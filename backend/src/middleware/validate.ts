import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req[target];
    const result = schema.safeParse(value);
    if (result.success) {
      req[target] = result.data;
      next();
    } else {
      next(result.error);
    }
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return validate(schema as ZodSchema, 'query');
}

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return validate(schema as ZodSchema, 'body');
}

export function validateParams<T extends ZodTypeAny>(schema: T) {
  return validate(schema as ZodSchema, 'params');
}
