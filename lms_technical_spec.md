    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0
      run: |
        cd backend
        pytest --cov=app tests/
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: gcr.io/${{ secrets.GCP_PROJECT_ID }}/lms-api:${{ github.sha }}
```

---

## 13. Веб-интерфейс: Детальная спецификация

### 13.1 Требования к веб-интерфейсу

**Тестовый пользователь:**
- Username: `testdemo`
- Password: `demotest`

**Основные страницы:**
1. **Страница входа** - аутентификация пользователя
2. **Дашборд обучения** - главная страница с прогрессом и навигацией
3. **Страница урока** - отображение контента урока
4. **Страница теста** - прохождение тестирования
5. **Страница результатов** - детальные результаты теста

**Обязательные элементы интерфейса:**
- Текущий модуль и номер урока
- Оценки за пройденные модули (по 10-балльной системе)
- Общая средняя оценка за все модули
- Прогресс-бар текущего модуля
- Навигация между уроками

### 13.2 Структура Frontend проекта (полная)

```
lms-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── logo.png
│
├── src/
│   ├── api/
│   │   ├── axios.ts
│   │   ├── auth.ts
│   │   ├── modules.ts
│   │   └── progress.ts
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── ProgressOverview.tsx
│   │   │   ├── GradesSummary.tsx
│   │   │   └── CurrentStatus.tsx
│   │   │
│   │   ├── lesson/
│   │   │   ├── LessonViewer.tsx
│   │   │   ├── LessonNavigation.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   │
│   │   ├── test/
│   │   │   ├── TestQuestions.tsx
│   │   │   ├── TestResult.tsx
│   │   │   └── QuestionTypes/
│   │   │       ├── SingleChoice.tsx
│   │   │       ├── MultipleChoice.tsx
│   │   │       └── TextInput.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Loading.tsx
│   │       └── GradeDisplay.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ProgressContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
# Техническое задание: Обучающая система с базой знаний и тестированием

## 1. Название проекта и краткое резюме

**Название:** LMS Platform (Learning Management System)

**Цель:** Создать масштабируемую обучающую систему с последовательной выдачей учебных материалов, отслеживанием прогресса пользователей и автоматизированным тестированием.

**Оптимизированный стек технологий:**
- **Backend:** Python (FastAPI)
- **Database:** PostgreSQL 15+
- **Storage:** Google Cloud Storage / AWS S3 (вместо Google Drive)
- **Cache:** Redis
- **Frontend:** React + TypeScript
- **Deployment:** Docker + Kubernetes / Docker Compose

---

## 2. Контекст и рамки проекта

### Что будет автоматизировано:
- REST API для управления обучением
- Последовательная выдача уроков по модулям
- Отслеживание прогресса пользователей с персистентностью
- Обработка команды "дальше" для перехода к следующему уроку
- Автоматический переход к тестированию после завершения модуля
- Проверка ответов на тесты с использованием различных стратегий
- Выставление оценок и формирование отчетов

### Архитектура системы:

```
┌─────────────┐
│   Frontend  │ (React + TypeScript)
│   (Web App) │
└──────┬──────┘
       │ HTTPS/REST API
       ▼
┌─────────────────────────────────┐
│   Backend API (FastAPI)         │
│   - Auth & Authorization        │
│   - Business Logic              │
│   - Content Delivery            │
│   - Test Evaluation             │
└────┬────────────┬───────────────┘
     │            │
     ▼            ▼
┌─────────┐  ┌──────────────┐
│PostgreSQL│  │ Redis Cache  │
│  (Main   │  │ (Sessions +  │
│   DB)    │  │  Content)    │
└─────────┘  └──────────────┘
     │
     ▼
┌──────────────────┐
│ Cloud Storage    │
│ (GCS/S3)         │
│ - Lessons        │
│ - Tests          │
└──────────────────┘
```

### Требования к производительности:
- Время отклика API: < 200ms (95 перцентиль)
- Поддержка одновременных пользователей: 1000+
- Доступность: 99.9% uptime
- Масштабирование: горизонтальное через Kubernetes

---

## 3. Детальная спецификация Backend API

### 3.1 Технологический стек Backend

```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
google-cloud-storage==2.13.0  # или boto3 для AWS
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

### 3.2 Структура проекта

```
lms-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration management
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── modules.py      # Module management
│   │   │   ├── lessons.py      # Lesson delivery
│   │   │   ├── tests.py        # Test submission & grading
│   │   │   └── progress.py     # User progress tracking
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── cache.py            # Redis operations
│   │   └── storage.py          # Cloud storage interface
│   │
│   ├── crud/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── module.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   └── test.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # SQLAlchemy models
│   │   ├── module.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   └── test.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas
│   │   ├── module.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   └── test.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── content_service.py  # Content delivery logic
│   │   ├── test_service.py     # Test evaluation logic
│   │   └── progress_service.py # Progress tracking
│   │
│   └── db/
│       ├── __init__.py
│       ├── base.py
│       └── session.py
│
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_lessons.py
│   └── test_tests.py
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .env.example
├── .gitignore
├── alembic.ini
├── pytest.ini
└── README.md
```

### 3.3 API Endpoints

#### Authentication

```python
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

#### Modules & Lessons

```python
GET    /api/v1/modules                    # List all modules
GET    /api/v1/modules/{module_id}        # Get module details
POST   /api/v1/modules/{module_id}/start  # Start module
GET    /api/v1/modules/{module_id}/lessons/{lesson_id}  # Get lesson content
POST   /api/v1/modules/{module_id}/next   # Get next lesson or test
```

#### Tests

```python
GET    /api/v1/modules/{module_id}/test   # Get test questions
POST   /api/v1/modules/{module_id}/test   # Submit test answers
GET    /api/v1/tests/results/{result_id}  # Get test results
```

#### Progress

```python
GET    /api/v1/progress                   # Get user's overall progress
GET    /api/v1/progress/{module_id}       # Get progress for specific module
```

### 3.4 Пример реализации ключевых endpoints

#### main.py

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis.asyncio as redis

from app.api.v1 import auth, modules, lessons, tests, progress
from app.core.config import settings
from app.db.session import engine
from app.models.base import Base

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Create tables (in production use Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis
    app.state.redis = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True
    )
    
    yield
    
    # Shutdown
    await app.state.redis.close()

app = FastAPI(
    title="LMS Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(modules.router, prefix="/api/v1/modules", tags=["modules"])
app.include_router(lessons.router, prefix="/api/v1/lessons", tags=["lessons"])
app.include_router(tests.router, prefix="/api/v1/tests", tags=["tests"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

#### models/progress.py

```python
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.base import Base

class ProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    TESTING = "testing"
    COMPLETED = "completed"
    FAILED = "failed"

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    module_id = Column(String(50), nullable=False)
    current_lesson = Column(Integer, default=0)
    total_lessons = Column(Integer, nullable=False)
    status = Column(Enum(ProgressStatus), default=ProgressStatus.NOT_STARTED)
    started_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="progress")
    test_results = relationship("TestResult", back_populates="progress")
    
    __table_args__ = (
        {'schema': 'public'}
    )
```

#### models/test.py

```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    progress_id = Column(UUID(as_uuid=True), ForeignKey("user_progress.id"))
    module_id = Column(String(50), nullable=False)
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    percentage = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    answers = Column(JSON, nullable=False)  # Store user answers
    detailed_results = Column(JSON, nullable=False)  # Question-by-question results
    attempt_number = Column(Integer, default=1)
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    progress = relationship("UserProgress", back_populates="test_results")
```

#### services/content_service.py

```python
from typing import Optional, Dict, Any
import json
from google.cloud import storage
import redis.asyncio as redis

from app.core.config import settings
from app.core.cache import CacheService

class ContentService:
    def __init__(self, redis_client: redis.Redis):
        self.storage_client = storage.Client()
        self.bucket = self.storage_client.bucket(settings.GCS_BUCKET_NAME)
        self.cache = CacheService(redis_client)
    
    async def get_lesson_content(
        self, 
        module_id: str, 
        lesson_number: int
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve lesson content from cache or cloud storage
        """
        cache_key = f"lesson:{module_id}:{lesson_number}"
        
        # Try cache first
        cached = await self.cache.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Fetch from storage
        blob_path = f"lessons/{module_id}/lesson_{lesson_number:02d}.md"
        blob = self.bucket.blob(blob_path)
        
        if not blob.exists():
            return None
        
        content = blob.download_as_text()
        
        lesson_data = {
            "module_id": module_id,
            "lesson_number": lesson_number,
            "content": content,
            "content_type": "markdown"
        }
        
        # Cache for 1 hour
        await self.cache.set(cache_key, json.dumps(lesson_data), expire=3600)
        
        return lesson_data
    
    async def get_test_questions(self, module_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve test questions from storage
        """
        cache_key = f"test_questions:{module_id}"
        
        cached = await self.cache.get(cache_key)
        if cached:
            return json.loads(cached)
        
        blob_path = f"tests/{module_id}/test_questions.json"
        blob = self.bucket.blob(blob_path)
        
        if not blob.exists():
            return None
        
        content = blob.download_as_text()
        questions = json.loads(content)
        
        # Cache for 1 hour
        await self.cache.set(cache_key, content, expire=3600)
        
        return questions
    
    async def get_correct_answers(self, module_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve correct answers (internal use only)
        """
        blob_path = f"tests/{module_id}/correct_answers.json"
        blob = self.bucket.blob(blob_path)
        
        if not blob.exists():
            return None
        
        content = blob.download_as_text()
        return json.loads(content)
```

#### services/test_service.py

```python
from typing import List, Dict, Any
from app.schemas.test import TestSubmission, TestResult

class TestGradingService:
    
    def grade_test(
        self,
        user_answers: List[Dict[str, Any]],
        correct_answers: List[Dict[str, Any]],
        passing_threshold: float = 0.7
    ) -> TestResult:
        """
        Grade test submission and return detailed results
        """
        score = 0
        max_score = len(correct_answers)
        detailed_results = []
        
        # Create answer lookup dict
        correct_lookup = {
            ans["question_id"]: ans["correct_answer"] 
            for ans in correct_answers
        }
        
        for user_answer in user_answers:
            question_id = user_answer["question_id"]
            user_response = user_answer["answer"]
            correct_response = correct_lookup.get(question_id)
            
            is_correct = self._compare_answers(user_response, correct_response)
            
            if is_correct:
                score += 1
            
            detailed_results.append({
                "question_id": question_id,
                "correct": is_correct,
                "user_answer": user_response,
                "correct_answer": correct_response if not is_correct else None
            })
        
        percentage = int((score / max_score) * 100)
        passed = (score / max_score) >= passing_threshold
        
        return TestResult(
            score=score,
            max_score=max_score,
            percentage=percentage,
            passed=passed,
            detailed_results=detailed_results
        )
    
    def _compare_answers(self, user_answer: Any, correct_answer: Any) -> bool:
        """
        Compare user answer with correct answer
        Supports multiple question types
        """
        if isinstance(correct_answer, list):
            # Multiple choice - compare sorted lists
            return sorted(user_answer) == sorted(correct_answer)
        elif isinstance(correct_answer, str):
            # Single choice - case insensitive comparison
            return str(user_answer).strip().lower() == correct_answer.strip().lower()
        else:
            return user_answer == correct_answer
```

#### api/v1/lessons.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.progress import UserProgress, ProgressStatus
from app.services.content_service import ContentService
from app.services.progress_service import ProgressService
from app.schemas.lesson import LessonResponse, NextLessonRequest

router = APIRouter()

@router.post("/modules/{module_id}/next")
async def get_next_lesson(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    content_service: ContentService = Depends(),
    progress_service: ProgressService = Depends()
):
    """
    Get next lesson in sequence or transition to test
    """
    # Get user progress
    progress = await progress_service.get_user_progress(
        db, current_user.id, module_id
    )
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not started. Please start the module first."
        )
    
    # Check if module is completed
    if progress.status == ProgressStatus.COMPLETED:
        return {
            "status": "completed",
            "message": "Module already completed",
            "test_result_id": progress.test_results[-1].id if progress.test_results else None
        }
    
    # Check if all lessons completed -> start test
    if progress.current_lesson >= progress.total_lessons:
        await progress_service.update_status(db, progress.id, ProgressStatus.TESTING)
        
        test_questions = await content_service.get_test_questions(module_id)
        
        return {
            "status": "module_completed",
            "message": "All lessons completed. Ready for test.",
            "test_available": True,
            "test_questions": test_questions
        }
    
    # Get next lesson
    next_lesson_number = progress.current_lesson + 1
    lesson_content = await content_service.get_lesson_content(
        module_id, next_lesson_number
    )
    
    if not lesson_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lesson {next_lesson_number} not found"
        )
    
    # Update progress
    await progress_service.update_current_lesson(
        db, progress.id, next_lesson_number
    )
    
    progress_percentage = int((next_lesson_number / progress.total_lessons) * 100)
    
    return {
        "status": "success",
        "lesson_number": next_lesson_number,
        "total_lessons": progress.total_lessons,
        "content": lesson_content["content"],
        "content_type": "markdown",
        "module_id": module_id,
        "progress_percentage": progress_percentage
    }
```

#### api/v1/tests.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.progress import ProgressStatus
from app.models.test import TestResult
from app.services.content_service import ContentService
from app.services.test_service import TestGradingService
from app.services.progress_service import ProgressService
from app.schemas.test import TestSubmission, TestResultResponse

router = APIRouter()

@router.post("/modules/{module_id}/test")
async def submit_test(
    module_id: str,
    submission: TestSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    content_service: ContentService = Depends(),
    grading_service: TestGradingService = Depends(),
    progress_service: ProgressService = Depends()
):
    """
    Submit test answers and get results
    """
    # Get user progress
    progress = await progress_service.get_user_progress(
        db, current_user.id, module_id
    )
    
    if not progress or progress.status != ProgressStatus.TESTING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test not available. Complete all lessons first."
        )
    
    # Get correct answers
    correct_answers = await content_service.get_correct_answers(module_id)
    
    if not correct_answers:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Test answers not found"
        )
    
    # Grade test
    result = grading_service.grade_test(
        submission.answers,
        correct_answers
    )
    
    # Calculate attempt number
    attempt_number = len(progress.test_results) + 1
    
    # Save result
    test_result = TestResult(
        progress_id=progress.id,
        module_id=module_id,
        score=result.score,
        max_score=result.max_score,
        percentage=result.percentage,
        passed=result.passed,
        answers=submission.answers,
        detailed_results=result.detailed_results,
        attempt_number=attempt_number
    )
    
    db.add(test_result)
    
    # Update progress status
    if result.passed:
        progress.status = ProgressStatus.COMPLETED
        progress.completed_at = datetime.utcnow()
        # Unlock next module logic here
    else:
        progress.status = ProgressStatus.FAILED
    
    await db.commit()
    await db.refresh(test_result)
    
    return {
        "status": "test_completed",
        "result_id": test_result.id,
        "score": result.score,
        "max_score": result.max_score,
        "percentage": result.percentage,
        "passed": result.passed,
        "detailed_results": result.detailed_results,
        "attempt_number": attempt_number,
        "next_module_unlocked": f"Module_{int(module_id.split('_')[1]) + 1:02d}" if result.passed else None
    }
```

---

## 4. База данных

### 4.1 Схема PostgreSQL

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- User progress table
CREATE TYPE progress_status AS ENUM (
    'not_started', 
    'in_progress', 
    'testing', 
    'completed', 
    'failed'
);

CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    current_lesson INTEGER DEFAULT 0,
    total_lessons INTEGER NOT NULL,
    status progress_status DEFAULT 'not_started',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, module_id)
);

CREATE INDEX idx_progress_user_module ON user_progress(user_id, module_id);
CREATE INDEX idx_progress_status ON user_progress(status);

-- Test results table
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_id UUID NOT NULL REFERENCES user_progress(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    detailed_results JSONB NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_results_progress ON test_results(progress_id);
CREATE INDEX idx_test_results_user_module ON test_results(progress_id, module_id);

-- Modules metadata (optional - can be stored in files)
CREATE TABLE modules (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_lessons INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_order ON modules(order_index);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Индексы и оптимизация

```sql
-- Additional performance indexes
CREATE INDEX idx_progress_user_status ON user_progress(user_id, status);
CREATE INDEX idx_test_results_completed ON test_results(completed_at DESC);

-- Partial index for active users
CREATE INDEX idx_users_active ON users(id) WHERE is_active = true;

-- GIN index for JSONB search in test results
CREATE INDEX idx_test_results_answers ON test_results USING GIN(answers);
```

---

## 5. Cloud Storage структура

### 5.1 Google Cloud Storage (или S3) структура

```
lms-content-bucket/
├── lessons/
│   ├── Module_01/
│   │   ├── lesson_01.md
│   │   ├── lesson_02.md
│   │   ├── lesson_03.md
│   │   └── metadata.json
│   ├── Module_02/
│   │   └── ...
│   └── Module_03/
│       └── ...
│
├── tests/
│   ├── Module_01/
│   │   ├── test_questions.json
│   │   └── correct_answers.json
│   ├── Module_02/
│   │   └── ...
│   └── Module_03/
│       └── ...
│
└── assets/
    ├── images/
    ├── videos/
    └── documents/
```

### 5.2 Формат файлов

#### metadata.json
```json
{
  "module_id": "Module_01",
  "title": "Введение в Python",
  "description": "Основы языка программирования Python",
  "total_lessons": 10,
  "estimated_hours": 5,
  "difficulty": "beginner",
  "prerequisites": [],
  "learning_outcomes": [
    "Понимание базового синтаксиса Python",
    "Работа с переменными и типами данных"
  ]
}
```

#### test_questions.json
```json
{
  "module_id": "Module_01",
  "passing_threshold": 0.7,
  "time_limit_minutes": 30,
  "questions": [
    {
      "question_id": "q1",
      "type": "single_choice",
      "question": "Что такое Python?",
      "options": [
        {"id": "A", "text": "Язык программирования"},
        {"id": "B", "text": "База данных"},
        {"id": "C", "text": "Операционная система"},
        {"id": "D", "text": "Текстовый редактор"}
      ],
      "points": 1
    },
    {
      "question_id": "q2",
      "type": "multiple_choice",
      "question": "Какие из следующих являются типами данных в Python?",
      "options": [
        {"id": "A", "text": "int"},
        {"id": "B", "text": "string"},
        {"id": "C", "text": "boolean"},
        {"id": "D", "text": "htmlElement"}
      ],
      "points": 2
    },
    {
      "question_id": "q3",
      "type": "text_input",
      "question": "Какой оператор используется для присваивания значения переменной в Python?",
      "placeholder": "Введите символ",
      "points": 1
    }
  ]
}
```

#### correct_answers.json
```json
{
  "module_id": "Module_01",
  "answers": [
    {
      "question_id": "q1",
      "correct_answer": "A",
      "explanation": "Python - это высокоуровневый язык программирования общего назначения"
    },
    {
      "question_id": "q2",
      "correct_answer": ["A", "B", "C"],
      "explanation": "int, string и boolean являются встроенными типами данных Python"
    },
    {
      "question_id": "q3",
      "correct_answer": "=",
      "explanation": "Оператор = используется для присваивания значений переменным"
    }
  ]
}
```

---

## 6. Frontend (React + TypeScript)

### 6.1 Структура проекта Frontend

```
lms-frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── axios.ts              # Axios configuration
│   │   ├── auth.ts               # Auth API calls
│   │   ├── modules.ts            # Modules API calls
│   │   └── tests.ts              # Tests API calls
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── lesson/
│   │   │   ├── LessonViewer.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   ├── test/
│   │   │   ├── TestQuestions.tsx
│   │   │   ├── TestResult.tsx
│   │   │   └── QuestionTypes/
│   │   │       ├── SingleChoice.tsx
│   │   │       ├── MultipleChoice.tsx
│   │   │       └── TextInput.tsx
│   │   ├── progress/
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ModuleCard.tsx
│   │   └── common/
│   │       ├── Navbar.tsx
│   │       ├── Button.tsx
│   │       └── Loading.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ProgressContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
│   │   └── useLesson.ts
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ModuleView.tsx
│   │   ├── LessonView.tsx
│   │   └── TestView.tsx
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── module.ts
│   │   ├── lesson.ts
│   │   └── test.ts
│   │
│   ├── utils/
│   │   ├── storage.ts
│   │   └── validators.ts
│   │
│   ├── App.tsx
│   ├── index.tsx
│   └── routes.tsx
│
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### 6.2 Ключевые компоненты

#### LessonViewer.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getLessonContent, getNextLesson } from '../../api/modules';
import ProgressBar from '../progress/ProgressBar';
import Button from '../common/Button';

interface LessonData {
  lesson_number: number;
  total_lessons: number;
  content: string;
  progress_percentage: number;
  module_id: string;
}

const LessonViewer: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    try {
      setLoading(true);
      const response = await getNextLesson(moduleId!);
      
      if (response.status === 'module_completed') {
        // Navigate to test
        navigate(`/modules/${moduleId}/test`, {
          state: { testQuestions: response.test_questions }
        });
      } else if (response.status === 'success') {
        setLesson(response);
      }
    } catch (err) {
      setError('Failed to load next lesson');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!lesson) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ProgressBar 
        current={lesson.lesson_number} 
        total={lesson.total_lessons}
        percentage={lesson.progress_percentage}
      />
      
      <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
        <h1 className="text-3xl font-bold mb-4">
          Урок {lesson.lesson_number} из {lesson.total_lessons}
        </h1>
        
        <div className="prose max-w-none">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>
        
        <div className="mt-8 flex justify-between">
          <Button 
            variant="secondary"
            onClick={() => navigate(`/modules/${moduleId}`)}
          >
            Вернуться к модулю
          </Button>
          
          <Button 
            variant="primary"
            onClick={handleNext}
          >
            Дальше
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
```

#### TestQuestions.tsx

```typescript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitTest } from '../../api/tests';
import SingleChoice from './QuestionTypes/SingleChoice';
import MultipleChoice from './QuestionTypes/MultipleChoice';
import TextInput from './QuestionTypes/TextInput';
import Button from '../common/Button';

interface Question {
  question_id: string;
  type: string;
  question: string;
  options?: Array<{ id: string; text: string }>;
  points: number;
}

const TestQuestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testQuestions } = location.state;
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer
      }));

      const result = await submitTest(testQuestions.module_id, {
        answers: formattedAnswers
      });

      navigate(`/modules/${testQuestions.module_id}/result`, {
        state: { result }
      });
    } catch (error) {
      console.error('Failed to submit test:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'single_choice':
        return (
          <SingleChoice
            question={question}
            value={answers[question.question_id]}
            onChange={(value) => handleAnswerChange(question.question_id, value)}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoice
            question={question}
            value={answers[question.question_id] || []}
            onChange={(value) => handleAnswerChange(question.question_id, value)}
          />
        );
      case 'text_input':
        return (
          <TextInput
            question={question}
            value={answers[question.question_id] || ''}
            onChange={(value) => handleAnswerChange(question.question_id, value)}
          />
        );
      default:
        return null;
    }
  };

  const allAnswered = testQuestions.questions.every(
    (q: Question) => answers[q.question_id] !== undefined
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Тест по модулю</h1>
        
        <div className="space-y-8">
          {testQuestions.questions.map((question: Question, index: number) => (
            <div key={question.question_id} className="border-b pb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  Вопрос {index + 1}
                </h3>
                <span className="text-sm text-gray-500">
                  {question.points} {question.points === 1 ? 'балл' : 'балла'}
                </span>
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="w-full"
          >
            {submitting ? 'Отправка...' : 'Отправить тест'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestQuestions;
```

---

## 7. Кэширование (Redis)

### 7.1 Стратегия кэширования

```python
# app/core/cache.py
import json
from typing import Optional, Any
import redis.asyncio as redis

class CacheService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        return await self.redis.get(key)
    
    async def set(
        self, 
        key: str, 
        value: str, 
        expire: int = 3600
    ) -> bool:
        """Set value in cache with expiration"""
        return await self.redis.setex(key, expire, value)
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        return await self.redis.delete(key) > 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        return await self.redis.exists(key) > 0
    
    async def get_or_set(
        self,
        key: str,
        fetch_func,
        expire: int = 3600
    ) -> Any:
        """Get from cache or fetch and cache"""
        cached = await self.get(key)
        if cached:
            return json.loads(cached)
        
        value = await fetch_func()
        await self.set(key, json.dumps(value), expire)
        return value
```

### 7.2 Кэшируемые данные

| Тип данных | Ключ | TTL | Стратегия инвалидации |
|------------|------|-----|----------------------|
| Контент урока | `lesson:{module_id}:{lesson_num}` | 1 час | При обновлении файла |
| Вопросы теста | `test_questions:{module_id}` | 1 час | При обновлении файла |
| Прогресс пользователя | `progress:{user_id}:{module_id}` | 5 мин | При каждом обновлении |
| Метаданные модуля | `module:{module_id}` | 24 часа | При обновлении модуля |
| JWT токены (blacklist) | `token:blacklist:{jti}` | До истечения токена | N/A |

---

## 8. Безопасность

### 8.1 Аутентификация и авторизация

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await crud.user.get(db, id=user_id)
    if user is None:
        raise credentials_exception
    
    return user
```

### 8.2 Rate Limiting

```python
# app/middleware/rate_limit.py
from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Apply to specific endpoints
@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...

@router.post("/modules/{module_id}/test")
@limiter.limit("3/hour")
async def submit_test(request: Request, ...):
    ...
```

### 8.3 CORS и CSP

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600,
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## 9. Тестирование

### 9.1 Unit Tests

```python
# tests/test_grading_service.py
import pytest
from app.services.test_service import TestGradingService

class TestGradingService:
    
    def setup_method(self):
        self.service = TestGradingService()
    
    def test_single_choice_correct(self):
        user_answers = [{"question_id": "q1", "answer": "A"}]
        correct_answers = [{"question_id": "q1", "correct_answer": "A"}]
        
        result = self.service.grade_test(user_answers, correct_answers)
        
        assert result.score == 1
        assert result.passed == True
        assert result.percentage == 100
    
    def test_multiple_choice_correct(self):
        user_answers = [{"question_id": "q1", "answer": ["A", "B"]}]
        correct_answers = [{"question_id": "q1", "correct_answer": ["A", "B"]}]
        
        result = self.service.grade_test(user_answers, correct_answers)
        
        assert result.score == 1
        assert result.passed == True
    
    def test_passing_threshold(self):
        user_answers = [
            {"question_id": "q1", "answer": "A"},
            {"question_id": "q2", "answer": "B"},
            {"question_id": "q3", "answer": "A"}
        ]
        correct_answers = [
            {"question_id": "q1", "correct_answer": "A"},
            {"question_id": "q2", "correct_answer": "A"},
            {"question_id": "q3", "correct_answer": "A"}
        ]
        
        result = self.service.grade_test(user_answers, correct_answers, passing_threshold=0.7)
        
        assert result.score == 2
        assert result.percentage == 66
        assert result.passed == False
```

### 9.2 Integration Tests

```python
# tests/test_api_lessons.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_next_lesson(
    async_client: AsyncClient,
    test_user_token: str,
    test_module_id: str
):
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    response = await async_client.post(
        f"/api/v1/modules/{test_module_id}/next",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "content" in data
    assert data["lesson_number"] > 0

@pytest.mark.asyncio
async def test_complete_module_workflow(
    async_client: AsyncClient,
    test_user_token: str,
    test_module_with_3_lessons: str
):
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    # Start module
    response = await async_client.post(
        f"/api/v1/modules/{test_module_with_3_lessons}/start",
        headers=headers
    )
    assert response.status_code == 200
    
    # Get lessons 1, 2, 3
    for i in range(3):
        response = await async_client.post(
            f"/api/v1/modules/{test_module_with_3_lessons}/next",
            headers=headers
        )
        assert response.status_code == 200
    
    # Next should return test
    response = await async_client.post(
        f"/api/v1/modules/{test_module_with_3_lessons}/next",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "module_completed"
    assert data["test_available"] == True
```

### 9.3 Load Testing (Locust)

```python
# tests/load/locustfile.py
from locust import HttpUser, task, between

class LMSUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def get_next_lesson(self):
        self.client.post(
            "/api/v1/modules/Module_01/next",
            headers=self.headers
        )
    
    @task(1)
    def get_progress(self):
        self.client.get(
            "/api/v1/progress",
            headers=self.headers
        )
    
    @task(1)
    def submit_test(self):
        self.client.post(
            "/api/v1/modules/Module_01/test",
            headers=self.headers,
            json={
                "answers": [
                    {"question_id": "q1", "answer": "A"},
                    {"question_id": "q2", "answer": ["A", "B"]}
                ]
            }
        )
```

---

## 10. Развертывание

### 10.1 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://lms_user:lms_pass@postgres:5432/lms_db
      - REDIS_URL=redis://redis:6379/0
      - GCS_BUCKET_NAME=lms-content-dev
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=lms_user
      - POSTGRES_PASSWORD=lms_pass
      - POSTGRES_DB=lms_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start

volumes:
  postgres_data:
  redis_data:
```

### 10.2 Dockerfile (Backend)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 10.3 Kubernetes Deployment (Production)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lms-api
  namespace: lms-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lms-api
  template:
    metadata:
      labels:
        app: lms-api
    spec:
      containers:
      - name: api
        image: gcr.io/project-id/lms-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: lms-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: lms-secrets
              key: redis-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: lms-secrets
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: lms-api-service
  namespace: lms-production
spec:
  selector:
    app: lms-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## 11. Мониторинг и логирование

### 11.1 Structured Logging

```python
# app/core/logging.py
import logging
import json
from datetime import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        if hasattr(record, 'module_id'):
            log_data['module_id'] = record.module_id
        
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Configure logger
def setup_logging():
    logger = logging.getLogger("lms")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    
    return logger
```

### 11.2 Prometheus Metrics

```python
# app/middleware/metrics.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Request
import time

# Metrics
request_count = Counter(
    'lms_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'lms_http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

lesson_views = Counter(
    'lms_lesson_views_total',
    'Total lesson views',
    ['module_id', 'lesson_number']
)

test_submissions = Counter(
    'lms_test_submissions_total',
    'Total test submissions',
    ['module_id', 'passed']
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

---

## 12. CI/CD Pipeline

### 12.1 GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0
      run: |
        cd backend
        pytest --cov=app tests/
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    