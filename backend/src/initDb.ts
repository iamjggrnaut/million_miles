import { pool } from './db.js';

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(32) UNIQUE NOT NULL,
  source_url TEXT,
  brand VARCHAR(128) NOT NULL,
  model VARCHAR(256) NOT NULL,
  year INTEGER,
  mileage_km INTEGER,
  price_jpy INTEGER,
  price_total_jpy INTEGER,
  body_type VARCHAR(64),
  color VARCHAR(64),
  transmission VARCHAR(64),
  fuel_type VARCHAR(64),
  drive_type VARCHAR(64),
  brand_ja VARCHAR(128),
  model_ja TEXT,
  body_type_ja VARCHAR(128),
  color_ja VARCHAR(128),
  description TEXT,
  dealer_name VARCHAR(256),
  region VARCHAR(128),
  description_en TEXT,
  description_ru TEXT,
  dealer_name_en VARCHAR(256),
  dealer_name_ru VARCHAR(256),
  region_en VARCHAR(128),
  region_ru VARCHAR(128),
  model_en VARCHAR(256),
  model_ru VARCHAR(256),
  photos TEXT[],
  raw_specs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)`;

const CREATE_FUNCTION = `
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql`;

const TRANSLATION_COLUMNS = [
  'description_en TEXT',
  'description_ru TEXT',
  'dealer_name_en VARCHAR(256)',
  'dealer_name_ru VARCHAR(256)',
  'region_en VARCHAR(128)',
  'region_ru VARCHAR(128)',
  'model_en VARCHAR(256)',
  'model_ru VARCHAR(256)',
];

export async function initDb(): Promise<void> {
  await pool.query(CREATE_TABLE);
  for (const col of TRANSLATION_COLUMNS) {
    const [name, ...typeParts] = col.split(' ');
    const type = typeParts.join(' ');
    await pool.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS ${name} ${type}`);
  }
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price_jpy)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cars_mileage ON cars(mileage_km)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at)');
  await pool.query(CREATE_FUNCTION);
  await pool.query('DROP TRIGGER IF EXISTS cars_updated_at ON cars');
  await pool.query(`
    CREATE TRIGGER cars_updated_at
    BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at()
  `);
}
