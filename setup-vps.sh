#!/bin/bash

# Скрипт быстрой настройки для VPS
# Использование: ./setup-vps.sh [dev|prod]

set -e

MODE=${1:-dev}
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo "========================================="
echo "Настройка LMS для VPS"
echo "========================================="
echo "IP адрес сервера: $SERVER_IP"
echo "Режим: $MODE"
echo ""

# Проверка наличия .env
if [ ! -f .env ]; then
    echo "Создание .env файла из ENV_EXAMPLE..."
    cp ENV_EXAMPLE .env
fi

# Генерация SECRET_KEY
SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

echo "Генерация паролей..."

# Обновление .env
if [ "$MODE" = "prod" ]; then
    # Production режим
    sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://${SERVER_IP}/api/v1|g" .env
    sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://${SERVER_IP},http://${SERVER_IP}:80|g" .env
else
    # Development режим
    sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://${SERVER_IP}:8000/api/v1|g" .env
    sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://${SERVER_IP}:3000|g" .env
fi

# Обновление паролей
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|g" .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://lms_user:${DB_PASSWORD}@db:5432/lms_db|g" .env
sed -i "s|SECRET_KEY=.*|SECRET_KEY=${SECRET_KEY}|g" .env

echo "✅ .env файл обновлен"
echo ""

# Настройка firewall
echo "Настройка firewall..."
if command -v ufw &> /dev/null; then
    if [ "$MODE" = "prod" ]; then
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
    else
        sudo ufw allow 3000/tcp
        sudo ufw allow 8000/tcp
    fi
    echo "✅ Firewall настроен"
else
    echo "⚠️  ufw не найден, настройте firewall вручную"
fi
echo ""

# Запуск контейнеров
echo "Запуск контейнеров..."
if [ "$MODE" = "prod" ]; then
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml up -d --build
    echo ""
    echo "Ожидание запуска сервисов..."
    sleep 10
    echo "Инициализация базы данных..."
    docker-compose -f docker-compose.prod.yml exec -T backend python init_db.py
    echo ""
    echo "✅ Production версия запущена"
    echo ""
    echo "Приложение доступно по адресу:"
    echo "  http://${SERVER_IP}"
    echo "  http://${SERVER_IP}/health (health check)"
else
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    echo ""
    echo "Ожидание запуска сервисов..."
    sleep 10
    echo "Инициализация базы данных..."
    docker-compose exec -T backend python init_db.py
    echo ""
    echo "✅ Development версия запущена"
    echo ""
    echo "Приложение доступно по адресу:"
    echo "  Frontend: http://${SERVER_IP}:3000"
    echo "  Backend:  http://${SERVER_IP}:8000"
    echo "  Health:   http://${SERVER_IP}:8000/health"
fi

echo ""
echo "========================================="
echo "Проверка статуса контейнеров:"
echo "========================================="
if [ "$MODE" = "prod" ]; then
    docker-compose -f docker-compose.prod.yml ps
else
    docker-compose ps
fi

echo ""
echo "Для просмотра логов:"
if [ "$MODE" = "prod" ]; then
    echo "  docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "  docker-compose logs -f"
fi

