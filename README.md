# Million Miles — тестовое задание

Каталог автомобилей с парсингом CarSensor, backend на Node.js + PostgreSQL, frontend на Next.js.

## Стек

- **БД:** PostgreSQL 16
- **Backend:** Express, TypeScript, JWT, node-pg, Zod (валидация), Helmet, rate-limit, единый error handler, авто-инициализация схемы БД
- **Worker:** парсинг CarSensor (cheerio, axios), retry с backoff, структурированное логирование, node-cron раз в час, локальный перевод (Argos) на EN/RU
- **Frontend:** Next.js 14, React, Tailwind CSS, общие типы (shared), Error Boundary, фильтры по марке/году/цене/пробегу, перехват 401, отображение переведённых полей
- **CI:** GitHub Actions — lint, test, build для backend, worker, frontend
- **Docker:** Dockerfile для backend, worker (c Python + Argos), frontend (Next.js standalone)

## Быстрый старт

### 1. База данных

**Вариант A — через Docker:**

```bash
docker compose up -d postgres
```

**Вариант B — без Docker (локальный PostgreSQL):**

1. Установи и запусти PostgreSQL (порт 5432).
2. Создай пользователя и БД:
   ```sql
   CREATE USER app WITH PASSWORD 'app_secret';
   CREATE DATABASE million_miles OWNER app;
   ```
3. Таблицы создавать вручную не нужно: при первом запуске **backend** сам выполнит инициализацию схемы (см. `backend/src/initDb.ts`).

Параметры по умолчанию: `localhost:5432`, БД `million_miles`, пользователь `app`, пароль `app_secret`.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Сервер: http://localhost:4000  
Логин для API: `admin` / `admin123`

### 3. Worker (парсер + переводчик)

```bash
cd worker
cp .env.example .env
npm install
npm run dev
```

Парсинг по расписанию раз в час. Один раз вручную: `npm run scrape:once`.

Если установлен Argos Translate и модели (`translate-ja_en`, `translate-ja_ru` и/или `translate-en_ru`), воркер будет автоматически переводить описание, дилера, регион и модель на английский и русский и сохранять их в дополнительные поля.

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
npm run dev
```

Приложение: http://localhost:3000  
Вход: `admin` / `admin123`

## Переменные окружения

### Backend (`.env`)

- `PORT` — порт (по умолчанию 4000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — подключение к PostgreSQL
- `JWT_SECRET` — секрет для JWT
- `ADMIN_LOGIN`, `ADMIN_PASSWORD` — учётные данные (по умолчанию admin / admin123)
- `CORS_ORIGIN` — разрешённый origin для CORS (например http://localhost:3000)

### Worker (`.env`)

- Те же `DB_*` для PostgreSQL
- `SCRAPE_MAX_PAGES` — сколько страниц списка обходить (по умолчанию 2)
- `SCRAPE_MAX_CARS` — макс. машин за один запуск (по умолчанию 30)
- `SCRAPE_DELAY_MS` — пауза между запросами в мс (по умолчанию 2500)
- `LOCAL_TRANSLATE_ENABLED` — включить/выключить локальный переводчик (по умолчанию `true`)
- `TRANSLATE_CMD` — команда для Argos CLI (по умолчанию `argos-translate`)

### Frontend (`.env.local`)

- `NEXT_PUBLIC_API_URL` — URL backend API (по умолчанию http://localhost:4000)

## Дополнительно

- **API:** описание эндпоинтов и кодов ошибок — см. `backend/README.md`
- **Health:** `GET /health` проверяет подключение к БД (200 — ок, 503 — БД недоступна)
- **Тесты:** `cd backend && npm test` (Vitest, схемы и getOrderBy)
- **Worker:** детали по скрапингу и переводу — см. `worker/README.md`
- **Сборка в Docker:** в каждой папке (backend, worker, frontend) — `docker build -t <name> .`

## Формат сдачи

- Исходный код: репозиторий на GitHub/GitLab
- Развёрнутое приложение: задеплоить frontend + backend + БД (например Railway, Render, Vercel + отдельный backend/DB)
