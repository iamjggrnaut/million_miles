import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).default(4000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_NAME: z.string().min(1).default('million_miles'),
  DB_USER: z.string().min(1).default('app'),
  DB_PASSWORD: z.string().min(1).default('app_secret'),
  JWT_SECRET: z.string().min(8).default('dev-secret-change-in-production'),
  ADMIN_LOGIN: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).default('admin123'),
  CORS_ORIGIN: z.string().url().optional().or(z.literal('*')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && process.env.NODE_ENV === 'production') {
  console.error('Invalid environment variables:', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.success ? parsed.data : (envSchema.parse({}) as z.infer<typeof envSchema>);
