import pg from 'pg';
import type { ScrapedCar } from './scraper.js';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME ?? 'million_miles',
  user: process.env.DB_USER ?? 'app',
  password: process.env.DB_PASSWORD ?? 'app_secret',
});

export async function upsertCar(car: ScrapedCar): Promise<void> {
  await pool.query(
    `INSERT INTO cars (
      external_id, source_url, brand, model, year, mileage_km,
      price_jpy, price_total_jpy, body_type, color, transmission, fuel_type, drive_type,
      brand_ja, model_ja, body_type_ja, color_ja, description, dealer_name, region,
      description_en, description_ru, dealer_name_en, dealer_name_ru, region_en, region_ru, model_en, model_ru,
      photos, raw_specs
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
    ON CONFLICT (external_id) DO UPDATE SET
      source_url = EXCLUDED.source_url,
      brand = EXCLUDED.brand,
      model = EXCLUDED.model,
      year = EXCLUDED.year,
      mileage_km = EXCLUDED.mileage_km,
      price_jpy = EXCLUDED.price_jpy,
      price_total_jpy = EXCLUDED.price_total_jpy,
      body_type = EXCLUDED.body_type,
      color = EXCLUDED.color,
      transmission = EXCLUDED.transmission,
      fuel_type = EXCLUDED.fuel_type,
      drive_type = EXCLUDED.drive_type,
      brand_ja = EXCLUDED.brand_ja,
      model_ja = EXCLUDED.model_ja,
      body_type_ja = EXCLUDED.body_type_ja,
      color_ja = EXCLUDED.color_ja,
      description = EXCLUDED.description,
      dealer_name = EXCLUDED.dealer_name,
      region = EXCLUDED.region,
      description_en = EXCLUDED.description_en,
      description_ru = EXCLUDED.description_ru,
      dealer_name_en = EXCLUDED.dealer_name_en,
      dealer_name_ru = EXCLUDED.dealer_name_ru,
      region_en = EXCLUDED.region_en,
      region_ru = EXCLUDED.region_ru,
      model_en = EXCLUDED.model_en,
      model_ru = EXCLUDED.model_ru,
      photos = EXCLUDED.photos,
      raw_specs = EXCLUDED.raw_specs,
      updated_at = NOW()`,
    [
      car.external_id,
      car.source_url,
      car.brand,
      car.model,
      car.year,
      car.mileage_km,
      car.price_jpy,
      car.price_total_jpy,
      car.body_type,
      car.color,
      car.transmission,
      car.fuel_type,
      car.drive_type,
      car.brand_ja,
      car.model_ja,
      car.body_type_ja,
      car.color_ja,
      car.description,
      car.dealer_name,
      car.region,
      car.description_en ?? null,
      car.description_ru ?? null,
      car.dealer_name_en ?? null,
      car.dealer_name_ru ?? null,
      car.region_en ?? null,
      car.region_ru ?? null,
      car.model_en ?? null,
      car.model_ru ?? null,
      car.photos.length ? car.photos : null,
      Object.keys(car.raw_specs || {}).length ? JSON.stringify(car.raw_specs) : null,
    ]
  );
}
