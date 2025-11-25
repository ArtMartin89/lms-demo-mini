# LMS MVP - Основы ИИ

Минимально жизнеспособный продукт (MVP) системы управления обучением (LMS) с курсом "Основы ИИ".

## Структура проекта

```
LMS demo mini/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── routers/     # API endpoints
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   └── ...
│   ├── main.py          # FastAPI app
│   ├── init_db.py       # Database initialization
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── contexts/    # React contexts
│   │   └── ...
│   └── package.json
├── storage/             # Course content storage
│   └── courses/         # Course files
├── docker-compose.yml   # Docker configuration
└── README.md
```

## Быстрый старт

### Требования

- Docker и Docker Compose
- Git

### Установка и запуск

1. Клонируйте репозиторий или используйте текущую директорию

2. Запустите все сервисы:
```bash
docker-compose up -d
```

3. Инициализируйте базу данных:
```bash
docker-compose exec backend python init_db.py
```

4. Откройте в браузере:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Тестовые пользователи

После инициализации БД доступны:

- **Администратор**: 
  - Email: `admin@example.com`
  - Пароль: `admin123`

- **Студент**: 
  - Email: `student@example.com`
  - Пароль: `student123`

## Функционал MVP

### Реализовано

✅ **Аутентификация**
- Регистрация с выбором роли (студент/создатель/HR)
- Вход в систему
- JWT токены

✅ **Курсы и модули**
- Просмотр курса "Основы ИИ"
- 3 модуля с уроками
- Последовательное прохождение уроков

✅ **Уроки**
- Просмотр уроков в формате Markdown
- Отметка о завершении урока
- Прогресс обучения

✅ **Тесты**
- Прохождение тестов по модулям
- Таймер для тестов
- Автосохранение ответов
- Отслеживание переключений вкладок
- Результаты с детальной информацией

✅ **Прогресс**
- Отслеживание прогресса по модулям
- Статистика завершенных уроков
- Результаты тестов

### Не включено в MVP

- Админ-панель для редактирования контента
- Загрузка файлов (аудио, видео, изображения)
- Сертификаты о прохождении
- Множественные курсы (только один курс)
- Настройки профиля пользователя
- Восстановление пароля
- Email-уведомления
- Детальная аналитика
- Социальные функции

## API Endpoints

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `GET /api/v1/auth/me` - Текущий пользователь

### Курсы
- `GET /api/v1/courses` - Список курсов
- `GET /api/v1/courses/{course_id}` - Детали курса
- `GET /api/v1/courses/{course_id}/modules` - Модули курса

### Модули
- `GET /api/v1/modules/{module_id}` - Информация о модуле
- `POST /api/v1/modules/{module_id}/start` - Начать модуль

### Уроки
- `GET /api/v1/modules/{module_id}/lessons/{lesson_number}` - Получить урок
- `POST /api/v1/modules/{module_id}/lessons/{lesson_number}/complete` - Завершить урок

### Тесты
- `GET /api/v1/modules/{module_id}/test` - Получить тест
- `POST /api/v1/modules/{module_id}/test/submit` - Отправить ответы
- `GET /api/v1/modules/{module_id}/test/results` - Результаты теста

### Прогресс
- `GET /api/v1/progress` - Общий прогресс
- `GET /api/v1/progress/{module_id}` - Прогресс по модулю

## Структура базы данных

### Таблицы

- `users` - Пользователи
- `courses` - Курсы
- `modules` - Модули
- `lessons` - Уроки (метаданные)
- `user_progress` - Прогресс пользователей
- `test_attempts` - Попытки прохождения тестов

## Структура storage

Контент курсов хранится в файловой системе:

```
storage/courses/{course_id}/
├── metadata.json
└── modules/{module_id}/
    ├── metadata.json
    ├── lessons/{lesson_id}/
    │   └── content.md
    └── test/
        ├── questions.json
        └── settings.json
```

## Разработка

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Тестирование

### Проверка работоспособности

1. Запустите все сервисы: `docker-compose up -d`
2. Инициализируйте БД: `docker-compose exec backend python init_db.py`
3. Откройте http://localhost:3000
4. Зарегистрируйтесь или войдите как студент
5. Пройдите модуль: уроки → тест

### Health checks

- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000

## Соответствие требованиям

### TZ_MVP_LMS.md
✅ Docker Compose поднимает все сервисы
✅ Сервисы взаимодействуют корректно
✅ Health checks проходят
✅ Аутентификация и безопасность
✅ Последовательная выдача уроков
✅ Работающая система тестирования
✅ Сохранение прогресса

### checklist_mvp_lms.md
✅ Минимальные метрики (логирование действий)
✅ Онбординг (регистрация с выбором роли)
✅ Транзакционность (сохранение прогресса)
✅ Автосохранение ответов в тестах
✅ Понятные сообщения об ошибках
✅ ≤3 типов вопросов (multiple_choice, text)
✅ Прогресс и таймер при прохождении
✅ Уникальные ссылки (JWT токены)
✅ Логирование действий
✅ Предупреждения о смене вкладок
✅ Модульное разделение
✅ Нормализованная БД
✅ Миграции (через SQLAlchemy)

## Развертывание на VPS

### Подготовка

1. **Установите Docker и Docker Compose на VPS:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin -y
```

2. **Клонируйте проект на сервер:**
```bash
git clone <your-repo-url>
cd "LMS demo mini"
```

3. **Создайте файл `.env` на основе примера:**
```bash
# Скопируйте пример (если есть .env.example)
# Или создайте .env вручную со следующими переменными:
```

**Минимальный .env файл:**
```env
# Database
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=lms_db
DATABASE_URL=postgresql://lms_user:your_secure_password_here@db:5432/lms_db

# Backend
SECRET_KEY=your-secret-key-min-32-chars-change-this-in-production
STORAGE_PATH=/app/storage
CORS_ORIGINS=http://your-domain.com,https://your-domain.com

# Frontend
REACT_APP_API_URL=http://your-domain.com/api/v1
# или для HTTPS:
# REACT_APP_API_URL=https://your-domain.com/api/v1

# Nginx
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

### Развертывание (Production)

**Вариант 1: С Nginx (рекомендуется)**

1. **Создайте директорию для SSL сертификатов (если используете HTTPS):**
```bash
mkdir -p nginx/ssl
# Поместите сертификаты: cert.pem и key.pem в nginx/ssl/
```

2. **Запустите production конфигурацию:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. **Инициализируйте базу данных:**
```bash
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
```

4. **Проверьте статус:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

**Вариант 2: Без Nginx (для тестирования)**

1. **Используйте обычный docker-compose.yml:**
```bash
docker-compose up -d --build
docker-compose exec backend python init_db.py
```

2. **Откройте порты в firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# или для тестирования:
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

### Настройка домена

1. **Настройте DNS записи:**
   - A запись: `your-domain.com` → IP вашего VPS
   - A запись: `www.your-domain.com` → IP вашего VPS

2. **Обновите nginx/nginx.conf:**
   - Замените `your-domain.com` на ваш домен
   - Раскомментируйте HTTPS секцию, если используете SSL

3. **Настройте SSL (Let's Encrypt):**
```bash
# Установите certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Получите сертификат
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Или вручную:
# Поместите сертификаты в nginx/ssl/cert.pem и nginx/ssl/key.pem
```

### Обновление приложения

```bash
# Остановите контейнеры
docker-compose -f docker-compose.prod.yml down

# Обновите код
git pull

# Пересоберите и запустите
docker-compose -f docker-compose.prod.yml up -d --build

# Если изменилась структура БД, выполните миграции
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
```

### Мониторинг и логи

```bash
# Просмотр логов всех сервисов
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats
```

### Резервное копирование

```bash
# Бэкап базы данных
docker-compose -f docker-compose.prod.yml exec db pg_dump -U lms_user lms_db > backup_$(date +%Y%m%d).sql

# Бэкап storage
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/

# Восстановление БД
cat backup_20240101.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U lms_user lms_db
```

### Важные замечания

⚠️ **Безопасность:**
- Обязательно измените `SECRET_KEY` и пароли БД в `.env`
- Используйте HTTPS в production
- Настройте firewall (ufw/iptables)
- Регулярно обновляйте Docker образы

⚠️ **Производительность:**
- Для production рекомендуется использовать production build frontend (Dockerfile.prod)
- Настройте лимиты ресурсов в docker-compose.prod.yml
- Используйте reverse proxy (nginx) для статики

⚠️ **Хранение данных:**
- Данные БД хранятся в Docker volume `postgres_data`
- Контент курсов в `./storage` - убедитесь, что он сохранен при обновлениях

## Лицензия

Внутренний проект для демонстрации MVP LMS.

