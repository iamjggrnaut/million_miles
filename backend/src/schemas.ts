import { z } from 'zod';

export const loginBodySchema = z.object({
  login: z.string().min(1, 'Login is required').max(128),
  password: z.string().min(1, 'Password is required').max(256),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

const carSortField = z.enum(['year', 'price', 'mileage', 'created', 'brand']);
const sortOrder = z.enum(['asc', 'desc']);

export const carsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brand: z.string().max(128).optional(),
  year_min: z.coerce.number().int().min(1990).max(2030).optional(),
  year_max: z.coerce.number().int().min(1990).max(2030).optional(),
  price_min: z.coerce.number().int().min(0).optional(),
  price_max: z.coerce.number().int().min(0).optional(),
  mileage_max: z.coerce.number().int().min(0).optional(),
  sort: carSortField.optional(),
  order: sortOrder.optional(),
});

export type CarsQueryParsed = z.infer<typeof carsQuerySchema>;

export const carIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const sortFieldToColumn: Record<string, string> = {
  year: 'year',
  price: 'price_jpy',
  mileage: 'mileage_km',
  created: 'created_at',
  brand: 'brand',
};

export function getOrderBy(sort?: string, order?: string): { column: string; dir: 'ASC' | 'DESC' } {
  const column = sort && sortFieldToColumn[sort] ? sortFieldToColumn[sort] : 'created_at';
  const dir = order === 'asc' ? 'ASC' : 'DESC';
  return { column, dir };
}
