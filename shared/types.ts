/** Shared API types (backend + frontend) */

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
  created_at: string;
  updated_at: string;
}

export interface CarsResponse {
  items: Car[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CarSortField = 'year' | 'price' | 'mileage' | 'created' | 'brand';
export type SortOrder = 'asc' | 'desc';

export interface CarsQuery {
  page?: number;
  limit?: number;
  brand?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  mileage_max?: number;
  sort?: CarSortField;
  order?: SortOrder;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
