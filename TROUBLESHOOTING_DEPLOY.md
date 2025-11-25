# Устранение проблем при развертывании

## Проблема: Приложение не отображается по IP адресу

### Шаг 1: Проверка контейнеров

```bash
# Проверьте какие контейнеры запущены
docker ps

# Должны быть видны:
# - lms_db
# - lms_backend  
# - lms_frontend
# - lms_nginx (если используете production)
```

**Если контейнеры не запущены:**
```bash
# Проверьте логи
docker-compose logs
# или
docker-compose -f docker-compose.prod.yml logs

# Перезапустите
docker-compose up -d
# или
docker-compose -f docker-compose.prod.yml up -d
```

### Шаг 2: Проверка портов

**Если используете production (docker-compose.prod.yml):**
- Приложение доступно на порту **80** (через nginx)
- НЕ на порту 3000!

**Если используете development (docker-compose.yml):**
- Frontend на порту **3000**
- Backend на порту **8000**

Проверьте проброс портов:
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Шаг 3: Настройка Firewall

**Ubuntu/Debian (ufw):**
```bash
# Для production (nginx на порту 80)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Для development
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Проверьте статус
sudo ufw status

# Если firewall активен, но порты закрыты - откройте их
sudo ufw reload
```

**Проверка открытых портов:**
```bash
sudo netstat -tulpn | grep -E "80|3000|8000"
# или
sudo ss -tulpn | grep -E "80|3000|8000"
```

### Шаг 4: Проверка переменных окружения

**КРИТИЧЕСКИ ВАЖНО:** В `.env` файле используйте IP адрес сервера, НЕ localhost!

```bash
# Узнайте IP вашего сервера
curl ifconfig.me
# или
hostname -I

# Отредактируйте .env
nano .env
```

**Правильная конфигурация для VPS:**
```env
# Замените YOUR_SERVER_IP на реальный IP вашего сервера
REACT_APP_API_URL=http://YOUR_SERVER_IP:8000/api/v1
# или для production с nginx:
REACT_APP_API_URL=http://YOUR_SERVER_IP/api/v1

CORS_ORIGINS=http://YOUR_SERVER_IP:3000,http://YOUR_SERVER_IP
```

**После изменения .env пересоберите контейнеры:**
```bash
docker-compose down
docker-compose up -d --build
# или для production:
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Шаг 5: Проверка nginx (для production)

Если используете `docker-compose.prod.yml`, проверьте nginx:

```bash
# Проверьте логи nginx
docker logs lms_nginx

# Проверьте конфигурацию
docker exec lms_nginx nginx -t

# Проверьте доступность frontend из nginx
docker exec lms_nginx curl http://frontend:80
```

### Шаг 6: Проверка изнутри контейнеров

```bash
# Проверьте backend
docker exec lms_backend curl http://localhost:8000/health

# Проверьте frontend (для dev версии)
docker exec lms_frontend curl http://localhost:3000

# Проверьте nginx (для production)
docker exec lms_nginx curl http://localhost/health
```

### Шаг 7: Проверка с внешнего компьютера

```bash
# С вашего локального компьютера попробуйте:
curl http://YOUR_SERVER_IP/health  # для production
curl http://YOUR_SERVER_IP:3000    # для development

# Если не работает - проблема в firewall или сетевых настройках VPS
```

## Частые проблемы

### Проблема: "Connection refused"

**Причины:**
1. Firewall блокирует порты
2. Контейнеры не запущены
3. Порты не проброшены в docker-compose

**Решение:**
```bash
# 1. Проверьте контейнеры
docker ps

# 2. Откройте порты в firewall
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp

# 3. Проверьте проброс портов в docker-compose.yml
```

### Проблема: "CORS error" в браузере

**Причина:** CORS_ORIGINS не содержит ваш IP/домен

**Решение:**
```bash
# Обновите .env
CORS_ORIGINS=http://YOUR_SERVER_IP:3000,http://YOUR_SERVER_IP

# Перезапустите backend
docker-compose restart backend
```

### Проблема: Frontend показывает ошибку API

**Причина:** REACT_APP_API_URL указывает на localhost

**Решение:**
```bash
# Обновите .env с IP сервера
REACT_APP_API_URL=http://YOUR_SERVER_IP:8000/api/v1

# Пересоберите frontend
docker-compose down
docker-compose up -d --build
```

### Проблема: Nginx возвращает 502 Bad Gateway

**Причина:** Frontend или backend контейнеры не запущены

**Решение:**
```bash
# Проверьте статус всех контейнеров
docker-compose -f docker-compose.prod.yml ps

# Проверьте логи
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend

# Перезапустите
docker-compose -f docker-compose.prod.yml restart
```

## Быстрая диагностика

Запустите скрипт диагностики:
```bash
chmod +x check_deployment.sh
./check_deployment.sh
```

## Полная переустановка

Если ничего не помогает:

```bash
# Остановите все
docker-compose down
docker-compose -f docker-compose.prod.yml down

# Удалите volumes (ОСТОРОЖНО: удалит данные БД!)
docker volume rm lms_demo_mini_postgres_data

# Проверьте .env файл
cat .env

# Пересоберите и запустите
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend python init_db.py

# Проверьте логи
docker-compose -f docker-compose.prod.yml logs -f
```
