#!/bin/bash

echo "=== Диагностика развертывания LMS ==="
echo ""

# Проверка IP сервера
echo "1. IP адрес сервера:"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "   Внешний IP: $(curl -s ifconfig.me 2>/dev/null || echo 'не определен')"
echo "   Локальный IP: $(hostname -I | awk '{print $1}')"
echo ""

# Проверка Docker
echo "2. Проверка Docker:"
if command -v docker &> /dev/null; then
    echo "   ✓ Docker установлен: $(docker --version)"
else
    echo "   ✗ Docker не установлен"
    exit 1
fi
echo ""

# Проверка контейнеров
echo "3. Статус контейнеров:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "lms_|NAMES"
echo ""

# Проверка портов
echo "4. Открытые порты:"
echo "   Проверка порта 80 (nginx):"
if docker ps | grep -q lms_nginx; then
    echo "   ✓ Контейнер nginx запущен"
    docker port lms_nginx 2>/dev/null || echo "   ⚠ Порт не проброшен"
else
    echo "   ✗ Контейнер nginx не запущен"
fi

echo "   Проверка порта 3000 (frontend dev):"
if docker ps | grep -q lms_frontend; then
    echo "   ✓ Контейнер frontend запущен"
    docker port lms_frontend 2>/dev/null || echo "   ⚠ Порт не проброшен"
else
    echo "   ✗ Контейнер frontend не запущен"
fi

echo "   Проверка порта 8000 (backend):"
if docker ps | grep -q lms_backend; then
    echo "   ✓ Контейнер backend запущен"
    docker port lms_backend 2>/dev/null || echo "   ⚠ Порт не проброшен"
else
    echo "   ✗ Контейнер backend не запущен"
fi
echo ""

# Проверка firewall
echo "5. Проверка firewall (ufw):"
if command -v ufw &> /dev/null; then
    echo "   Статус ufw:"
    sudo ufw status | head -5
    echo ""
    echo "   Открытые порты:"
    sudo ufw status | grep -E "80|443|3000|8000" || echo "   ⚠ Порты не открыты в firewall"
else
    echo "   ⚠ ufw не установлен, проверьте iptables вручную"
fi
echo ""

# Проверка health checks
echo "6. Health checks:"
echo "   Backend health:"
curl -s http://localhost:8000/health 2>/dev/null && echo "   ✓ Backend работает" || echo "   ✗ Backend не отвечает"
echo "   Frontend (через nginx):"
curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null && echo "   ✓ Nginx работает" || echo "   ✗ Nginx не отвечает"
echo ""

# Проверка логов (последние 5 строк)
echo "7. Последние ошибки в логах:"
echo "   Backend:"
docker logs lms_backend --tail 5 2>&1 | grep -i error || echo "   Нет ошибок"
echo "   Frontend:"
docker logs lms_frontend --tail 5 2>&1 | grep -i error || echo "   Нет ошибок"
echo "   Nginx:"
docker logs lms_nginx --tail 5 2>&1 | grep -i error 2>/dev/null || echo "   Нет ошибок"
echo ""

# Рекомендации
echo "=== Рекомендации ==="
echo ""
if ! docker ps | grep -q lms_nginx; then
    echo "⚠ Вы используете dev версию (без nginx)"
    echo "  Доступ должен быть по: http://YOUR_IP:3000"
    echo "  Убедитесь что порт 3000 открыт в firewall:"
    echo "  sudo ufw allow 3000/tcp"
else
    echo "✓ Вы используете production версию (с nginx)"
    echo "  Доступ должен быть по: http://YOUR_IP (порт 80)"
    echo "  Убедитесь что порт 80 открыт в firewall:"
    echo "  sudo ufw allow 80/tcp"
fi
echo ""
echo "Для просмотра всех логов:"
echo "  docker-compose logs -f"
echo "  или"
echo "  docker-compose -f docker-compose.prod.yml logs -f"

