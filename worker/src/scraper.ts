import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  normalizeBrand,
  normalizeBodyType,
  normalizeColor,
  normalizeTransmission,
  parsePriceYen,
  parseMileageKm,
  parseYear,
} from './dictionary.js';
import { withRetry } from './retry.js';
import { logger } from './logger.js';
import { translateJaToEnAndRu } from './translator.js';

const BASE = 'https://carsensor.net';
const LIST_PATH = '/usedcar/index.html';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const client = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'User-Agent': USER_AGENT },
  maxRedirects: 5,
  validateStatus: (s) => s >= 200 && s < 400,
});

export interface ScrapedCar {
  external_id: string;
  source_url: string;
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
  photos: string[];
  raw_specs: Record<string, unknown>;
}

function extractExternalId(url: string): string | null {
  const m = url.match(/\/detail\/([A-Z0-9]+)/i);
  return m ? m[1] : null;
}

/**
 * Fetch listing page and extract detail links + basic data from list items.
 * CarSensor list structure: each car is in a box with link to detail, we parse what we can from list.
 */
export async function fetchListingPage(page = 1): Promise<{ detailUrls: string[]; hasMore: boolean }> {
  const params: Record<string, string> = { NEW: '1', SORT: '19' };
  if (page > 1) params.PAGE = String(page);

  logger.info('Fetching listing page', { page });
  const res = await withRetry(
    () => client.get<string>(LIST_PATH, { params }),
    { maxAttempts: 3, baseDelayMs: 2000, onRetry: (attempt, err) => logger.warn('Listing fetch retry', { attempt, page, error: String(err) }) }
  );

  const $ = cheerio.load(res.data);
  const detailUrls: string[] = [];

  $('a[href*="/usedcar/detail/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const full = href.startsWith('http') ? href : new URL(href, BASE).href;
      if (!detailUrls.includes(full)) detailUrls.push(full);
    }
  });

  const hasMore = $('a[href*="PAGE="], .pagination a').length > 0;
  logger.info('Listing page done', { page, detailCount: detailUrls.length, hasMore });
  return { detailUrls, hasMore };
}

/**
 * Scrape a single car detail page. Structure may vary; we use common selectors.
 */
export async function scrapeDetailPage(url: string): Promise<ScrapedCar | null> {
  const externalId = extractExternalId(url);
  if (!externalId) return null;

  try {
    const res = await withRetry(
      () => client.get<string>(url),
      { maxAttempts: 2, baseDelayMs: 1500, onRetry: (attempt, err) => logger.warn('Detail fetch retry', { attempt, url, error: String(err) }) }
    );
    const $ = cheerio.load(res.data);

    const getText = (sel: string) => $(sel).first().text().trim() || null;
    const getAttr = (sel: string, attr: string) => $(sel).first().attr(attr) || null;

    const title = getText('h1, .cassetteMain_title, [class*="title"]') || getText('title');
    const brandJa = getText('.cassetteMain_head .maker, [class*="maker"]') || title?.split(/\s/)[0] || null;
    const brand = normalizeBrand(brandJa ?? undefined);

    // Prefer explicit detail table cells to avoid picking up prices from ads/other blocks
    const priceTotalText =
      getText('th:contains("支払総額") + td strong') ||
      getText('th:contains("支払総額") + td') ||
      getText('[class*="priceTotal"], .priceTotal, [class*="総額"]') ||
      $('*:contains("支払総額")').first().next().text().trim() ||
      $('td:contains("支払総額")').first().siblings().first().text().trim();

    const priceBodyText =
      getText('th:contains("車両本体価格") + td strong') ||
      getText('th:contains("車両本体価格") + td') ||
      getText('[class*="priceBody"], .priceBody') ||
      $('*:contains("車両本体価格")').first().next().text().trim() ||
      $('*:contains("本体価格")').first().next().text().trim();

    const price_total_jpy = parsePriceYen(priceTotalText) ?? parsePriceYen(priceBodyText);
    const price_jpy = parsePriceYen(priceBodyText) ?? price_total_jpy;

    const yearText = getText('[class*="year"]') ||
      $('*:contains("年式")').first().next().text().trim() ||
      $('td:contains("年式")').siblings().first().text().trim();
    const mileageText = getText('[class*="mileage"], [class*="走行"]') ||
      $('*:contains("走行距離")').first().next().text().trim();
    const bodyTypeJa = getText('[class*="bodyType"], [class*="body"]') ||
      $('*:contains("ボディ")').first().next().text().trim();
    const colorJa = getText('[class*="color"]') || null;
    const transmissionJa = getText('[class*="mission"], [class*="ミッション"]') ||
      $('*:contains("ミッション")').first().next().text().trim();

    const photos: string[] = [];
    $('img[src*="carsensor"], img[data-src*="carsensor"], .slide img, [class*="photo"] img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !photos.includes(src)) {
        photos.push(src.startsWith('http') ? src : new URL(src, BASE).href);
      }
    });

    const dealerName = getText('[class*="shop"], [class*="dealer"], .shopName');
    const region = getText('[class*="region"], [class*="area"]');
    const modelText = title?.replace(brandJa || '', '').trim().slice(0, 256) || null;

    const [descTr, dealerTr, regionTr, modelTr] = await Promise.all([
      translateJaToEnAndRu(title),
      translateJaToEnAndRu(dealerName),
      translateJaToEnAndRu(region),
      translateJaToEnAndRu(modelText),
    ]);

    return {
      external_id: externalId,
      source_url: url,
      brand,
      model: modelText || 'Unknown',
      year: parseYear(yearText),
      mileage_km: parseMileageKm(mileageText),
      price_jpy,
      price_total_jpy,
      body_type: normalizeBodyType(bodyTypeJa ?? undefined),
      color: normalizeColor(colorJa ?? undefined),
      transmission: normalizeTransmission(transmissionJa ?? undefined),
      fuel_type: null,
      drive_type: null,
      brand_ja: brandJa,
      model_ja: title,
      body_type_ja: bodyTypeJa,
      color_ja: colorJa,
      description: title,
      dealer_name: dealerName,
      region,
      description_en: descTr.en,
      description_ru: descTr.ru,
      dealer_name_en: dealerTr.en,
      dealer_name_ru: dealerTr.ru,
      region_en: regionTr.en,
      region_ru: regionTr.ru,
      model_en: modelTr.en,
      model_ru: modelTr.ru,
      photos: photos.slice(0, 20),
      raw_specs: {},
    };
  } catch (err) {
    logger.error('Scrape detail failed', { url, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/**
 * Scrape listing page(s), then for each detail URL scrape the car and return records.
 * Limits to maxListPages and maxCarsPerRun to avoid overload.
 */
export async function runScrape(options: {
  maxListPages?: number;
  maxCarsPerRun?: number;
  delayMs?: number;
}): Promise<ScrapedCar[]> {
  const { maxListPages = 2, maxCarsPerRun = 50, delayMs = 2000 } = options;
  const results: ScrapedCar[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxListPages; page++) {
    const { detailUrls } = await fetchListingPage(page);
    for (let i = 0; i < detailUrls.length; i++) {
      if (results.length >= maxCarsPerRun) break;
      const url = detailUrls[i];
      const id = extractExternalId(url);
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);

      logger.info('Scraping detail', { n: results.length + 1, max: maxCarsPerRun, external_id: id });
      const car = await scrapeDetailPage(url);
      if (car) results.push(car);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    if (results.length >= maxCarsPerRun) break;
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return results;
}
