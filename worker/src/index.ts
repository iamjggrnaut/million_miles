import 'dotenv/config';
import cron from 'node-cron';
import { runScrape } from './scraper.js';
import { upsertCar } from './db.js';
import { logger } from './logger.js';

const MAX_LIST_PAGES = Number(process.env.SCRAPE_MAX_PAGES) || 2;
const MAX_CARS_PER_RUN = Number(process.env.SCRAPE_MAX_CARS) || 30;
const DELAY_MS = Number(process.env.SCRAPE_DELAY_MS) || 2500;

async function runJob(): Promise<void> {
  const startedAt = new Date().toISOString();
  logger.info('Scrape job started', { startedAt });
  try {
    const cars = await runScrape({
      maxListPages: MAX_LIST_PAGES,
      maxCarsPerRun: MAX_CARS_PER_RUN,
      delayMs: DELAY_MS,
    });
    let saved = 0;
    for (const car of cars) {
      try {
        await upsertCar(car);
        saved++;
      } catch (err) {
        logger.error('Failed to upsert car', { external_id: car.external_id, error: String(err) });
      }
    }
    logger.info('Scrape job completed', { startedAt, scraped: cars.length, saved });
  } catch (err) {
    logger.error('Scrape job failed', { startedAt, error: err instanceof Error ? err.message : String(err) });
  }
}

const runOnce = process.argv.includes('--once');
if (runOnce) {
  runJob()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else {
  runJob();
  cron.schedule('0 * * * *', runJob);
  logger.info('Worker started', { schedule: '0 * * * * (hourly)' });
}
