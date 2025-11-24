# Техническое задание: Архитектура хранения курсов, модулей и уроков

## 1. Общая структура данных

### 1.1 Иерархия сущностей
```
Курс (Course)
  ├── Модуль 1 (Module)
  │   ├── Урок 1 (Lesson)
  │   ├── Урок 2 (Lesson)
  │   ├── Урок 3 (Lesson)
  │   └── Тест (Test)
  ├── Модуль 2 (Module)
  │   ├── Урок 1 (Lesson)
  │   ├── Урок 2 (Lesson)
  │   ├── Урок 3 (Lesson)
  │   └── Тест (Test)
  └── Модуль 3 (Module)
      ├── Урок 1 (Lesson)
      ├── Урок 2 (Lesson)
      ├── Урок 3 (Lesson)
      └── Тест (Test)
```

### 1.2 Метаданные в базе данных

**Таблица: courses**
- `id` (UUID) - уникальный идентификатор курса
- `title` (String) - название курса
- `description` (Text) - описание курса
- `order_index` (Integer) - порядок отображения
- `is_active` (Boolean) - активен ли курс
- `created_at` (DateTime) - дата создания
- `updated_at` (DateTime) - дата последнего обновления

**Таблица: modules**
- `id` (String) - уникальный идентификатор модуля (например: "Company_Module_01")
- `course_id` (UUID, FK) - ссылка на курс
- `title` (String) - название модуля
- `description` (Text) - описание модуля
- `total_lessons` (Integer) - количество уроков в модуле
- `order_index` (Integer) - порядок отображения в курсе
- `is_active` (Boolean) - активен ли модуль
- `created_at` (DateTime) - дата создания
- `updated_at` (DateTime) - дата последнего обновления

**Таблица: lessons** (метаданные, не содержимое)
- `id` (String) - уникальный идентификатор урока (например: "Company_Module_01_Lesson_01")
- `module_id` (String, FK) - ссылка на модуль
- `lesson_number` (Integer) - номер урока в модуле (1, 2, 3...)
- `title` (String) - название урока
- `order_index` (Integer) - порядок отображения в модуле
- `is_active` (Boolean) - активен ли урок
- `created_at` (DateTime) - дата создания
- `updated_at` (DateTime) - дата последнего обновления

**Примечание:** Содержимое уроков, файлы и тесты хранятся в файловой системе, не в БД.

## 2. Структура файлового хранилища

### 2.1 Базовая структура директорий

```
storage/
├── courses/
│   ├── {course_id}/
│   │   ├── metadata.json          # Метаданные курса (название, описание, настройки)
│   │   ├── modules/
│   │   │   ├── {module_id}/
│   │   │   │   ├── metadata.json  # Метаданные модуля
│   │   │   │   ├── lessons/
│   │   │   │   │   ├── {lesson_id}/
│   │   │   │   │   │   ├── content.md          # Markdown содержимое урока
│   │   │   │   │   │   ├── files/              # Файлы урока (аудио, видео, изображения)
│   │   │   │   │   │   │   ├── audio/
│   │   │   │   │   │   │   ├── video/
│   │   │   │   │   │   │   └── images/
│   │   │   │   │   │   └── attachments/        # Дополнительные файлы (PDF, DOCX и т.д.)
│   │   │   │   │   └── ...
│   │   │   │   └── test/
│   │   │   │       ├── questions.json          # Вопросы и ответы теста
│   │   │   │       └── settings.json           # Настройки теста (проходной балл, время и т.д.)
│   │   │   └── ...
│   │   └── ...
│   └── ...
```

### 2.2 Детальное описание структуры

#### 2.2.1 Курс: `storage/courses/{course_id}/`

**Файл: `metadata.json`**
```json
{
  "course_id": "uuid-курса",
  "title": "Название курса",
  "description": "Описание курса",
  "order_index": 1,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "settings": {
    "completion_certificate": true,
    "min_completion_percentage": 80
  }
}
```

#### 2.2.2 Модуль: `storage/courses/{course_id}/modules/{module_id}/`

**Файл: `metadata.json`**
```json
{
  "module_id": "Company_Module_01",
  "course_id": "uuid-курса",
  "title": "Название модуля",
  "description": "Описание модуля",
  "total_lessons": 3,
  "order_index": 1,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 2.2.3 Урок: `storage/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/`

**Файл: `content.md`**
- Markdown содержимое урока
- Поддержка изображений, ссылок, форматирования
- Примеры кода, списки, таблицы

**Директория: `files/`**
- `audio/` - аудиофайлы урока (MP3, WAV, OGG)
- `video/` - видеофайлы урока (MP4, WebM, MOV)
- `images/` - изображения урока (JPG, PNG, GIF, SVG)
- `attachments/` - дополнительные файлы (PDF, DOCX, XLSX, ZIP)

**Структура именования файлов:**
- `{lesson_id}_audio_{index}.{ext}` - для аудио
- `{lesson_id}_video_{index}.{ext}` - для видео
- `{lesson_id}_image_{index}.{ext}` - для изображений
- `{lesson_id}_attachment_{index}.{ext}` - для вложений

**Пример:**
```
lessons/Company_Module_01_Lesson_01/
├── content.md
└── files/
    ├── audio/
    │   └── Company_Module_01_Lesson_01_audio_1.mp3
    ├── video/
    │   └── Company_Module_01_Lesson_01_video_1.mp4
    ├── images/
    │   └── Company_Module_01_Lesson_01_image_1.jpg
    └── attachments/
        └── Company_Module_01_Lesson_01_attachment_1.pdf
```

#### 2.2.4 Тест: `storage/courses/{course_id}/modules/{module_id}/test/`

**Файл: `questions.json`**
```json
{
  "module_id": "Company_Module_01",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Текст вопроса",
      "options": [
        {"id": "a", "text": "Вариант ответа A"},
        {"id": "b", "text": "Вариант ответа B"},
        {"id": "c", "text": "Вариант ответа C"},
        {"id": "d", "text": "Вариант ответа D"}
      ],
      "correct_answer": ["a"],
      "points": 1,
      "explanation": "Объяснение правильного ответа"
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "Вопрос с несколькими правильными ответами",
      "options": [
        {"id": "a", "text": "Вариант A"},
        {"id": "b", "text": "Вариант B"},
        {"id": "c", "text": "Вариант C"}
      ],
      "correct_answer": ["a", "b"],
      "points": 2,
      "explanation": "Объяснение"
    },
    {
      "id": "q3",
      "type": "text",
      "question": "Вопрос с текстовым ответом",
      "correct_answer": "правильный ответ",
      "points": 1,
      "explanation": "Объяснение"
    }
  ]
}
```

**Файл: `settings.json`**
```json
{
  "module_id": "Company_Module_01",
  "passing_threshold": 0.7,
  "time_limit_minutes": 30,
  "max_attempts": 3,
  "shuffle_questions": true,
  "show_results_immediately": false,
  "allow_review": true
}
```

## 3. Права доступа

### 3.1 Роли пользователей

**Роль: `user` (обычный пользователь)**
- ✅ Просмотр списка курсов
- ✅ Просмотр модулей курса
- ✅ Прохождение уроков
- ✅ Просмотр материалов уроков (текст, аудио, видео, файлы)
- ✅ Прохождение тестов
- ✅ Просмотр результатов тестов
- ✅ Просмотр прогресса обучения
- ❌ Редактирование курсов
- ❌ Редактирование модулей
- ❌ Редактирование уроков
- ❌ Редактирование тестов
- ❌ Загрузка/удаление файлов
- ❌ Создание новых курсов/модулей/уроков

**Роль: `superuser` (администратор)**
- ✅ Все права пользователя `user`
- ✅ Создание курсов
- ✅ Редактирование курсов (название, описание, настройки)
- ✅ Удаление курсов
- ✅ Создание модулей
- ✅ Редактирование модулей (название, описание, порядок)
- ✅ Удаление модулей
- ✅ Создание уроков
- ✅ Редактирование уроков (название, содержимое Markdown)
- ✅ Загрузка файлов в уроки (аудио, видео, изображения, вложения)
- ✅ Удаление файлов из уроков
- ✅ Удаление уроков
- ✅ Редактирование тестов (вопросы, ответы, настройки)
- ✅ Управление порядком курсов, модулей, уроков
- ✅ Активация/деактивация курсов, модулей, уроков

### 3.2 Проверка прав доступа

**На уровне API:**
- Все эндпоинты для редактирования должны проверять `is_superuser`
- Использовать dependency `get_current_admin_user` для защищенных эндпоинтов
- Возвращать HTTP 403 Forbidden при попытке доступа без прав

**На уровне фронтенда:**
- Скрывать кнопки редактирования для пользователей без прав
- Использовать компонент `AdminRoute` для защиты страниц админ-панели
- Показывать сообщения об ошибках при попытке доступа без прав

## 4. API Endpoints

### 4.1 Публичные эндпоинты (для всех авторизованных пользователей)

**Курсы:**
- `GET /api/v1/courses` - список всех активных курсов с модулями
- `GET /api/v1/courses/{course_id}` - детали курса с модулями

**Модули:**
- `GET /api/v1/modules/{module_id}` - информация о модуле
- `POST /api/v1/modules/{module_id}/start` - начать прохождение модуля

**Уроки:**
- `GET /api/v1/modules/{module_id}/lessons/{lesson_number}` - получить урок
- `GET /api/v1/modules/{module_id}/lessons/{lesson_number}/files/{file_type}/{filename}` - скачать файл урока

**Тесты:**
- `GET /api/v1/modules/{module_id}/test` - получить вопросы теста
- `POST /api/v1/modules/{module_id}/test/submit` - отправить ответы на тест
- `GET /api/v1/modules/{module_id}/test/results` - получить результаты теста

**Прогресс:**
- `GET /api/v1/progress` - получить общий прогресс пользователя
- `GET /api/v1/progress/{module_id}` - получить прогресс по модулю

### 4.2 Административные эндпоинты (только для superuser)

**Курсы:**
- `GET /api/v1/admin/courses` - список всех курсов (включая неактивные)
- `GET /api/v1/admin/courses/{course_id}` - детали курса
- `POST /api/v1/admin/courses` - создать курс
- `PUT /api/v1/admin/courses/{course_id}` - обновить курс
- `DELETE /api/v1/admin/courses/{course_id}` - удалить курс

**Модули:**
- `GET /api/v1/admin/courses/{course_id}/modules` - список модулей курса
- `GET /api/v1/admin/modules/{module_id}` - детали модуля
- `POST /api/v1/admin/modules` - создать модуль
- `PUT /api/v1/admin/modules/{module_id}` - обновить модуль
- `DELETE /api/v1/admin/modules/{module_id}` - удалить модуль

**Уроки:**
- `GET /api/v1/admin/modules/{module_id}/lessons` - список уроков модуля
- `GET /api/v1/admin/modules/{module_id}/lessons/{lesson_number}` - получить урок для редактирования
- `POST /api/v1/admin/modules/{module_id}/lessons` - создать урок
- `PUT /api/v1/admin/modules/{module_id}/lessons/{lesson_number}` - обновить урок
- `DELETE /api/v1/admin/modules/{module_id}/lessons/{lesson_number}` - удалить урок
- `POST /api/v1/admin/modules/{module_id}/lessons/{lesson_number}/files` - загрузить файл в урок
- `DELETE /api/v1/admin/modules/{module_id}/lessons/{lesson_number}/files/{file_type}/{filename}` - удалить файл из урока
- `GET /api/v1/admin/modules/{module_id}/lessons/{lesson_number}/files` - список файлов урока

**Тесты:**
- `GET /api/v1/admin/modules/{module_id}/test` - получить тест для редактирования
- `POST /api/v1/admin/modules/{module_id}/test` - сохранить тест
- `PUT /api/v1/admin/modules/{module_id}/test/settings` - обновить настройки теста

## 5. Сервисы и компоненты

### 5.1 Backend сервисы

**StorageService:**
- `get_course_metadata(course_id)` - получить метаданные курса
- `save_course_metadata(course_id, metadata)` - сохранить метаданные курса
- `get_module_metadata(course_id, module_id)` - получить метаданные модуля
- `save_module_metadata(course_id, module_id, metadata)` - сохранить метаданные модуля
- `get_lesson_content(course_id, module_id, lesson_id)` - получить содержимое урока
- `save_lesson_content(course_id, module_id, lesson_id, content)` - сохранить содержимое урока
- `list_lesson_files(course_id, module_id, lesson_id, file_type)` - список файлов урока
- `save_file(course_id, module_id, lesson_id, file_type, file, filename)` - загрузить файл
- `get_file(course_id, module_id, lesson_id, file_type, filename)` - скачать файл
- `delete_file(course_id, module_id, lesson_id, file_type, filename)` - удалить файл
- `get_test_questions(course_id, module_id)` - получить вопросы теста
- `save_test_questions(course_id, module_id, questions)` - сохранить вопросы теста
- `get_test_settings(course_id, module_id)` - получить настройки теста
- `save_test_settings(course_id, module_id, settings)` - сохранить настройки теста

**ContentService:**
- `get_lesson_for_user(module_id, lesson_number, user_id)` - получить урок для пользователя
- `validate_lesson_access(module_id, lesson_number, user_id)` - проверить доступ к уроку
- `get_next_lesson(module_id, current_lesson_number)` - получить следующий урок

**TestService:**
- `get_test_for_user(module_id, user_id)` - получить тест для пользователя
- `submit_test_answers(module_id, user_id, answers)` - отправить ответы
- `calculate_test_score(module_id, answers)` - вычислить балл
- `get_test_results(module_id, user_id)` - получить результаты теста

### 5.2 Frontend компоненты

**Страницы для пользователей:**
- `Dashboard` - главная страница со списком курсов и модулей
- `CourseView` - просмотр курса с модулями
- `LessonViewer` - просмотр урока с содержимым и файлами
- `TestQuestions` - прохождение теста
- `TestResults` - результаты теста

**Страницы для администраторов:**
- `AdminCourses` - управление курсами (список, создание, редактирование)
- `AdminCourseModules` - управление модулями курса
- `AdminLessons` - управление уроками модуля
- `AdminLessonEditor` - редактор урока (Markdown + загрузка файлов)
- `AdminTestEditor` - редактор теста (вопросы и ответы)

**Компоненты:**
- `AdminRoute` - защита админ-страниц
- `FileUpload` - компонент загрузки файлов
- `MarkdownEditor` - редактор Markdown для уроков
- `TestQuestionEditor` - редактор вопросов теста

## 6. Миграция данных

### 6.1 Текущее состояние
- Курсы и модули хранятся в БД
- Уроки хранятся в файловой системе по старой структуре
- Тесты хранятся в файловой системе по старой структуре

### 6.2 Новая структура
- Метаданные курсов и модулей остаются в БД
- Метаданные уроков добавляются в БД
- Содержимое уроков и тесты переорганизуются в новую структуру директорий

### 6.3 План миграции
1. Создать таблицу `lessons` в БД
2. Создать скрипт миграции для переноса уроков в новую структуру
3. Обновить `StorageService` для работы с новой структурой
4. Обновить API эндпоинты
5. Обновить фронтенд для работы с новой структурой

## 7. Безопасность

### 7.1 Проверка прав доступа
- Все административные эндпоинты должны проверять `is_superuser`
- Файлы должны быть доступны только авторизованным пользователям
- Загрузка файлов должна проверять права и валидировать типы файлов

### 7.2 Валидация файлов
- Проверка типов файлов (MIME type)
- Ограничение размера файлов
- Сканирование на вирусы (опционально)
- Ограничение расширений файлов

### 7.3 Ограничения
- Максимальный размер файла: 100 MB для видео, 10 MB для остальных
- Разрешенные типы:
  - Аудио: MP3, WAV, OGG
  - Видео: MP4, WebM, MOV
  - Изображения: JPG, PNG, GIF, SVG
  - Вложения: PDF, DOCX, XLSX, ZIP

## 8. Производительность

### 8.1 Кэширование
- Метаданные курсов и модулей кэшируются в Redis
- Содержимое уроков кэшируется в Redis (TTL: 1 час)
- Список файлов урока кэшируется в Redis (TTL: 30 минут)

### 8.2 Оптимизация
- Ленивая загрузка файлов (по требованию)
- Сжатие изображений при загрузке
- CDN для статических файлов (в продакшене)

## 9. Резервное копирование

### 9.1 База данных
- Ежедневное резервное копирование БД
- Хранение резервных копий 30 дней

### 9.2 Файловое хранилище
- Ежедневное резервное копирование директории `storage/`
- Синхронизация с облачным хранилищем (GCS/S3) в продакшене

## 10. Мониторинг и логирование

### 10.1 Логирование
- Логирование всех операций редактирования (кто, что, когда)
- Логирование загрузки/удаления файлов
- Логирование ошибок доступа

### 10.2 Метрики
- Количество курсов, модулей, уроков
- Размер хранилища
- Популярность курсов и модулей
- Успешность прохождения тестов

