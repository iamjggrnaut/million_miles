# Backend API

## Endpoints

### `POST /api/auth/login`

Авторизация. Тело запроса (JSON):

- `login` (string, обязательно)
- `password` (string, обязательно)

Ответ 200: `{ "token": "<JWT>" }`  
Ответ 400: ошибки валидации (Zod).  
Ответ 401: неверный логин или пароль.

---

### `GET /api/cars`

Список автомобилей. Требуется заголовок `Authorization: Bearer <token>`.

Query-параметры (все опциональны):

| Параметр     | Тип    | Описание                    |
|-------------|--------|-----------------------------|
| page        | number | Страница (по умолчанию 1)   |
| limit       | number | Размер страницы 1–100 (20)  |
| brand       | string | Фильтр по марке             |
| year_min    | number | Год от                      |
| year_max    | number | Год до                      |
| price_min   | number | Цена от (¥)                 |
| price_max   | number | Цена до (¥)                 |
| mileage_max | number | Пробег до (км)             |
| sort        | string | year \| price \| mileage \| created \| brand |
| order       | string | asc \| desc                 |

Ответ 200: `{ items: Car[], total, page, limit, totalPages }`  
Ответ 401: нет или неверный токен.

---

### `GET /api/cars/:id`

Один автомобиль по ID. Требуется `Authorization: Bearer <token>`.

Ответ 200: объект Car.  
Ответ 404: автомобиль не найден.  
Ответ 401: нет или неверный токен.

---

### `GET /health`

Проверка состояния сервиса и подключения к БД.

Ответ 200: `{ ok: true, db: "connected" }`  
Ответ 503: БД недоступна: `{ ok: false, db: "disconnected" }`.
