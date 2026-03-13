import type { NextFunction } from 'express';
import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { carsQuerySchema, carIdParamSchema, getOrderBy } from '../schemas.js';
import { validateQuery, validateParams } from '../middleware/validate.js';
import type { CarsQueryParsed } from '../schemas.js';

const router = Router();

router.get(
  '/',
  validateQuery(carsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as unknown as CarsQueryParsed;
      const { page, limit, brand, year_min, year_max, price_min, price_max, mileage_max, sort, order } = q;

      const conditions: string[] = ['1=1'];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (brand) {
        conditions.push(`brand = $${paramIndex}`);
        values.push(brand);
        paramIndex++;
      }
      if (year_min != null) {
        conditions.push(`year >= $${paramIndex}`);
        values.push(year_min);
        paramIndex++;
      }
      if (year_max != null) {
        conditions.push(`year <= $${paramIndex}`);
        values.push(year_max);
        paramIndex++;
      }
      if (price_min != null) {
        conditions.push(`price_jpy >= $${paramIndex}`);
        values.push(price_min);
        paramIndex++;
      }
      if (price_max != null) {
        conditions.push(`price_jpy <= $${paramIndex}`);
        values.push(price_max);
        paramIndex++;
      }
      if (mileage_max != null) {
        conditions.push(`(mileage_km IS NULL OR mileage_km <= $${paramIndex})`);
        values.push(mileage_max);
        paramIndex++;
      }

      const where = conditions.join(' AND ');
      const { column, dir } = getOrderBy(sort, order);
      const safeColumn = ['year', 'price_jpy', 'mileage_km', 'created_at', 'brand'].includes(column) ? column : 'created_at';

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM cars WHERE ${where}`,
        values
      );
      const total = countResult.rows[0]?.total ?? 0;

      const dataResult = await pool.query(
        `SELECT * FROM cars WHERE ${where} ORDER BY ${safeColumn} ${dir} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, (page - 1) * limit]
      );

      res.json({
        items: dataResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  validateParams(carIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      const result = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
      const car = result.rows[0];
      if (!car) {
        res.status(404).json({ error: 'Car not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(car);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
