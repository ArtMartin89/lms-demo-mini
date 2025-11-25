# Быстрое развертывание на VPS

## Шаги развертывания

### 1. Подготовка сервера

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin -y

# Клонирование проекта
git clone <your-repo-url>
cd "LMS demo mini"
```

### 2. Настройка переменных окружения

```bash
# Создайте .env файл
cp ENV_EXAMPLE .env

# Отредактируйте .env и укажите:
# - Надежные пароли для БД
# - SECRET_KEY (минимум 32 символа)
# - CORS_ORIGINS с вашим доменом
# - REACT_APP_API_URL с вашим доменом
nano .env
```

### 3. Запуск

**Production (с Nginx):**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
```

**Development (без Nginx):**
```bash
docker-compose up -d --build
docker-compose exec backend python init_db.py
```

### 4. Проверка

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost/health
```

### 5. Настройка домена (опционально)

1. Настройте DNS: A запись → IP вашего VPS
2. Обновите `nginx/nginx.conf`: замените `your-domain.com`
3. Для HTTPS: получите SSL сертификат (Let's Encrypt) и поместите в `nginx/ssl/`

## Важно

- ⚠️ Обязательно измените пароли и SECRET_KEY в `.env`
- ⚠️ Для production используйте HTTPS
- ⚠️ Настройте firewall (ufw/iptables)
- ⚠️ Регулярно делайте бэкапы БД

## Полезные команды

```bash
# Остановка
docker-compose -f docker-compose.prod.yml down

# Обновление
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Бэкап БД
docker-compose -f docker-compose.prod.yml exec db pg_dump -U lms_user lms_db > backup.sql
```

