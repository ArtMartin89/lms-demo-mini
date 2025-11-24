# Быстрый старт LMS MVP

## Шаг 1: Запуск сервисов

```bash
docker-compose up -d
```

Это запустит:
- PostgreSQL базу данных (порт 5432)
- Backend API (порт 8000)
- Frontend (порт 3000)

## Шаг 2: Инициализация базы данных

```bash
docker-compose exec backend python init_db.py
```

Это создаст:
- Таблицы в БД
- Тестового администратора: `admin@example.com` / `admin123`
- Тестового студента: `student@example.com` / `student123`
- Курс "Основы ИИ" с 3 модулями и уроками

## Шаг 3: Откройте приложение

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API документация: http://localhost:8000/docs

## Шаг 4: Войдите в систему

Используйте тестового студента:
- Email: `student@example.com`
- Пароль: `student123`

## Шаг 5: Пройдите курс

1. На главной странице выберите модуль
2. Пройдите уроки последовательно
3. Завершите каждый урок кнопкой "Завершить урок"
4. После всех уроков пройдите тест модуля
5. Посмотрите результаты теста

## Проверка работоспособности

### Health check

```bash
curl http://localhost:8000/health
```

Должен вернуть: `{"status":"healthy"}`

### Проверка БД

```bash
docker-compose exec db psql -U lms_user -d lms_db -c "SELECT COUNT(*) FROM users;"
```

Должно показать количество пользователей (минимум 2).

### Проверка логов

```bash
docker-compose logs backend
docker-compose logs frontend
```

## Остановка сервисов

```bash
docker-compose down
```

Для полной очистки (включая данные БД):

```bash
docker-compose down -v
```

## Решение проблем

### Порт уже занят

Измените порты в `docker-compose.yml`:
- Backend: `8000:8000` → `8001:8000`
- Frontend: `3000:3000` → `3001:3000`
- DB: `5432:5432` → `5433:5432`

### Ошибка подключения к БД

Убедитесь, что БД запущена:
```bash
docker-compose ps
```

Перезапустите сервисы:
```bash
docker-compose restart
```

### Frontend не загружается

Проверьте, что backend работает:
```bash
curl http://localhost:8000/health
```

Проверьте логи frontend:
```bash
docker-compose logs frontend
```

### Ошибки при инициализации БД

Удалите старую БД и создайте заново:
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python init_db.py
```

## Структура данных

После инициализации в БД будет:
- 1 курс: "Основы ИИ"
- 3 модуля: "Введение в ИИ", "Машинное обучение", "Применение ИИ"
- 9 уроков: по 3 урока в каждом модуле
- 3 теста: по одному на каждый модуль

## Следующие шаги

1. Зарегистрируйте нового пользователя
2. Пройдите все модули
3. Проверьте прогресс на главной странице
4. Посмотрите результаты тестов

## Дополнительная информация

- Полная документация: `README.md`
- Соответствие требованиям: `CHECKLIST_COMPLIANCE.md`
- Техническое задание: `TZ_MVP_LMS.md`

