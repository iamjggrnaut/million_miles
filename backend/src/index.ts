import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware, login } from './auth.js';
import carsRouter from './routes/cars.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateBody } from './middleware/validate.js';
import { loginBodySchema } from './schemas.js';
import { env } from './config.js';
import { pool } from './db.js';
import { initDb } from './initDb.js';

const app = express();
const PORT = env.PORT;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.CORS_ORIGIN ?? true,
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.post('/api/auth/login', validateBody(loginBodySchema), login);

app.use('/api/cars', authMiddleware, carsRouter);

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ ok: false, db: 'disconnected' });
  }
});

app.use(errorHandler);

async function start() {
  try {
    await initDb();
    console.log('DB schema ready');
  } catch (err) {
    console.error('DB init failed:', err);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

start();
