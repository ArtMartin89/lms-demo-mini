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

## Лицензия

Внутренний проект для демонстрации MVP LMS.

