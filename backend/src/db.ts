import pg from 'pg';
import { env } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

export interface Car {
  id: number;
  external_id: string;
  source_url: string | null;
  brand: string;
  model: string;
  year: number | null;
  mileage_km: number | null;
  price_jpy: number | null;
  price_total_jpy: number | null;
  body_type: string | null;
  color: string | null;
  transmission: string | null;
  fuel_type: string | null;
  drive_type: string | null;
  brand_ja: string | null;
  model_ja: string | null;
  body_type_ja: string | null;
  color_ja: string | null;
  description: string | null;
  dealer_name: string | null;
  region: string | null;
  description_en: string | null;
  description_ru: string | null;
  dealer_name_en: string | null;
  dealer_name_ru: string | null;
  region_en: string | null;
  region_ru: string | null;
  model_en: string | null;
  model_ru: string | null;
  photos: string[] | null;
  raw_specs: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}
