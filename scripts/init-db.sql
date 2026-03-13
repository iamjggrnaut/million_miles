-- Cars table: scraped data from CarSensor
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(32) UNIQUE NOT NULL,
  source_url TEXT,
  -- normalized (translated) fields
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
  -- raw Japanese (for reference)
  brand_ja VARCHAR(128),
  model_ja TEXT,
  body_type_ja VARCHAR(128),
  color_ja VARCHAR(128),
  -- extra
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
  photos TEXT[], -- array of image URLs
  raw_specs JSONB, -- any extra specs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price_jpy);
CREATE INDEX IF NOT EXISTS idx_cars_mileage ON cars(mileage_km);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cars_updated_at ON cars;
CREATE TRIGGER cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
