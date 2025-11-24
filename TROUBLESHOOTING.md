# Решение проблем

## Проблема: Не получается войти (ERR_EMPTY_RESPONSE)

### Причина
Backend не запущен или недоступен.

### Решение

1. **Проверьте, запущены ли сервисы:**
   ```bash
   docker-compose ps
   ```
   
   Должны быть запущены: `lms_db`, `lms_backend`, `lms_frontend`

2. **Если backend не запущен, запустите все сервисы:**
   ```bash
   docker-compose up -d
   ```

3. **Проверьте логи backend:**
   ```bash
   docker-compose logs backend
   ```
   
   Ищите ошибки подключения к БД или другие проблемы.

4. **Проверьте, что backend отвечает:**
   ```bash
   curl http://localhost:8000/health
   ```
   
   Должен вернуть: `{"status":"healthy"}`

5. **Проверьте, что БД инициализирована:**
   ```bash
   docker-compose exec backend python init_db.py
   ```

6. **Перезапустите frontend после изменения переменных окружения:**
   ```bash
   docker-compose restart frontend
   ```

### Если проблема сохраняется

1. **Остановите все сервисы:**
   ```bash
   docker-compose down
   ```

2. **Удалите volumes (если нужно):**
   ```bash
   docker-compose down -v
   ```

3. **Пересоберите образы:**
   ```bash
   docker-compose build --no-cache
   ```

4. **Запустите заново:**
   ```bash
   docker-compose up -d
   docker-compose exec backend python init_db.py
   ```

## Проблема: CORS ошибки

Если видите ошибки CORS в консоли браузера:

1. Убедитесь, что в `backend/main.py` правильно настроен CORS:
   ```python
   allow_origins=["http://localhost:3000"]
   ```

2. Перезапустите backend:
   ```bash
   docker-compose restart backend
   ```

## Проблема: База данных не подключается

1. **Проверьте, что БД запущена:**
   ```bash
   docker-compose ps db
   ```

2. **Проверьте логи БД:**
   ```bash
   docker-compose logs db
   ```

3. **Проверьте подключение:**
   ```bash
   docker-compose exec db psql -U lms_user -d lms_db -c "SELECT 1;"
   ```

## Проблема: Frontend не загружается

1. **Проверьте логи frontend:**
   ```bash
   docker-compose logs frontend
   ```

2. **Проверьте, что порт 3000 свободен:**
   ```bash
   netstat -ano | findstr :3000
   ```

3. **Пересоберите frontend:**
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

## Проблема: Неправильный URL API

Если в консоли браузера видите запросы не на `/api/v1/...`:

1. Проверьте переменную окружения в `docker-compose.yml`:
   ```yaml
   REACT_APP_API_URL: http://localhost:8000/api/v1
   ```

2. Перезапустите frontend:
   ```bash
   docker-compose restart frontend
   ```

3. Очистите кэш браузера (Ctrl+Shift+R)

## Общие команды для диагностики

```bash
# Статус всех сервисов
docker-compose ps

# Логи всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Перезапуск сервиса
docker-compose restart backend

# Пересборка и перезапуск
docker-compose build backend
docker-compose up -d backend

# Полная перезагрузка
docker-compose down
docker-compose up -d
docker-compose exec backend python init_db.py
```

