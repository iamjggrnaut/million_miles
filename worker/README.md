# Worker (CarSensor scraper)

Воркер для парсинга объявлений с CarSensor и сохранения машин в PostgreSQL.

## Функциональность

- Периодический парсинг списка автомобилей (node-cron, раз в час).
- Переход по ссылкам на карточки, сбор полей:
  - марка, модель, год, пробег, цена (основная и «с учётом»),
  - тип кузова, цвет, КПП, топливо, привод,
  - дилер, регион, описание, фото.
- Нормализация японских полей через словари (`dictionary.ts`).
- Повторные попытки запросов с экспоненциальным backoff (`retry.ts`).
- Структурированное логирование в JSON (`logger.ts`).
- **Локальный переводчик** (без API-ключей) через Argos Translate:
  - перевод с японского на **английский** и **русский** для:
    - описания объявления,
    - названия дилера,
    - региона,
    - модели.
  - результаты сохраняются в поля `description_en/ru`, `dealer_name_en/ru`, `region_en/ru`, `model_en/ru`.

## Запуск (локально)

```bash
cd worker
cp .env.example .env
npm install
npm run dev      # cron + немедленный запуск
# или
npm run scrape:once   # один прогон без расписания
```

### Переменные окружения (`.env`)

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — доступ к PostgreSQL.
- `SCRAPE_MAX_PAGES` — сколько страниц списка обходить (по умолчанию 2).
- `SCRAPE_MAX_CARS` — макс. машин за один запуск (по умолчанию 30).
- `SCRAPE_DELAY_MS` — пауза между запросами в мс (по умолчанию 2500).
- `LOCAL_TRANSLATE_ENABLED` — вкл/выкл локальный переводчик (`true`/`false`).
- `TRANSLATE_CMD` — команда для Argos CLI (по умолчанию `argos-translate`).

## Локальный переводчик (Argos Translate)

Перевод реализован через CLI `argos-translate`, без внешних API:

1. На хосте (или внутри Docker-образа) должен быть установлен Argos Translate:
   - `pip install argos-translate`
   - `argospm update`
2. Установить языковые модели:
   - `argospm install translate-ja_en`
   - `argospm install translate-ja_ru` (если доступно)
   - `argospm install translate-en_ru` (для цепочки `ja -> en -> ru`).

Если CLI или модели недоступны, воркер логирует предупреждение и использует оригинальный японский текст (логика не ломается).

