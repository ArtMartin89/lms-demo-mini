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

# Узнайте IP вашего сервера
SERVER_IP=$(curl -s ifconfig.me)
echo "Ваш IP: $SERVER_IP"

# Отредактируйте .env и укажите:
# - Надежные пароли для БД
# - SECRET_KEY (минимум 32 символа)
# - CORS_ORIGINS с IP вашего сервера (НЕ localhost!)
# - REACT_APP_API_URL с IP вашего сервера (НЕ localhost!)
nano .env
```

**ВАЖНО:** В .env файле используйте IP адрес сервера, а не localhost:
```env
# Правильно:
REACT_APP_API_URL=http://YOUR_SERVER_IP:8000/api/v1
CORS_ORIGINS=http://YOUR_SERVER_IP:3000

# Неправильно:
REACT_APP_API_URL=http://localhost:8000/api/v1
CORS_ORIGINS=http://localhost:3000
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

### 4. Настройка Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # если используете dev версию
sudo ufw allow 8000/tcp  # если используете dev версию
sudo ufw reload

# Проверьте статус
sudo ufw status
```

### 5. Проверка

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps
# или для dev версии:
docker-compose ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f
# или
docker-compose logs -f

# Health check (с сервера)
curl http://localhost/health  # для prod
curl http://localhost:8000/health  # для dev

# Проверка с внешнего компьютера (замените YOUR_SERVER_IP)
curl http://YOUR_SERVER_IP/health  # для prod
curl http://YOUR_SERVER_IP:3000   # для dev
```

**Если приложение не отображается:**

1. **Запустите скрипт диагностики:**
```bash
chmod +x check_deployment.sh
./check_deployment.sh
```

2. **Проверьте основные моменты:**
   - Контейнеры запущены: `docker ps`
   - Порты открыты в firewall: `sudo ufw status`
   - В `.env` указан IP сервера, а не localhost
   - Для production используйте порт 80, для dev - порт 3000

3. **Смотрите подробное руководство:** `TROUBLESHOOTING_DEPLOY.md`

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

