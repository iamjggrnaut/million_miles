import { describe, it, expect } from 'vitest';
import { loginBodySchema, carsQuerySchema, carIdParamSchema, getOrderBy } from './schemas.js';

describe('loginBodySchema', () => {
  it('accepts valid login and password', () => {
    const result = loginBodySchema.safeParse({ login: 'admin', password: 'admin123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty login', () => {
    const result = loginBodySchema.safeParse({ login: '', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginBodySchema.safeParse({ login: 'admin', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('carsQuerySchema', () => {
  it('applies defaults for page and limit', () => {
    const result = carsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces string numbers', () => {
    const result = carsQuerySchema.safeParse({ page: '2', limit: '10', year_min: '2015' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
      expect(result.data.year_min).toBe(2015);
    }
  });

  it('rejects limit > 100', () => {
    const result = carsQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

describe('carIdParamSchema', () => {
  it('accepts positive integer', () => {
    const result = carIdParamSchema.safeParse({ id: 42 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(42);
  });

  it('coerces string to number', () => {
    const result = carIdParamSchema.safeParse({ id: '5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(5);
  });

  it('rejects zero', () => {
    const result = carIdParamSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });
});

describe('getOrderBy', () => {
  it('returns default created_at desc', () => {
    expect(getOrderBy(undefined, undefined)).toEqual({ column: 'created_at', dir: 'DESC' });
  });
  it('maps sort to column and order', () => {
    expect(getOrderBy('price', 'asc')).toEqual({ column: 'price_jpy', dir: 'ASC' });
    expect(getOrderBy('year', 'desc')).toEqual({ column: 'year', dir: 'DESC' });
  });
});
