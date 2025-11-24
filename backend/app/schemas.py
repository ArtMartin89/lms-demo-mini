from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    role: str
    is_superuser: bool

    class Config:
        from_attributes = True


# Courses
class CourseResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    order_index: int
    is_active: bool

    class Config:
        from_attributes = True


# Modules
class ModuleResponse(BaseModel):
    id: str
    course_id: UUID
    title: str
    description: Optional[str]
    total_lessons: int
    order_index: int
    is_active: bool

    class Config:
        from_attributes = True


# Lessons
class LessonResponse(BaseModel):
    id: str
    module_id: str
    lesson_number: int
    title: str
    order_index: int
    is_active: bool

    class Config:
        from_attributes = True


class LessonContentResponse(BaseModel):
    lesson: LessonResponse
    content: str
    next_lesson: Optional[LessonResponse] = None


# Tests
class TestQuestionOption(BaseModel):
    id: str
    text: str


class TestQuestion(BaseModel):
    id: str
    type: str  # multiple_choice, text
    question: str
    options: Optional[List[TestQuestionOption]] = None
    points: int


class TestResponse(BaseModel):
    module_id: str
    questions: List[TestQuestion]
    settings: Dict[str, Any]


class TestAnswer(BaseModel):
    question_id: str
    answer: Any  # str or List[str]


class TestSubmission(BaseModel):
    answers: List[TestAnswer]
    time_spent_seconds: Optional[int] = None
    suspicious_activity: Optional[Dict[str, Any]] = None


class TestResult(BaseModel):
    attempt_id: UUID
    score: float
    max_score: float
    percentage: float
    passed: bool
    submitted_at: datetime
    time_spent_seconds: Optional[int]
    suspicious_activity: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


# Progress
class LessonProgress(BaseModel):
    lesson_id: str
    lesson_number: int
    is_completed: bool
    completed_at: Optional[datetime]


class ModuleProgress(BaseModel):
    module_id: str
    completed_lessons: int
    total_lessons: int
    progress_percentage: float
    lessons: List[LessonProgress]
    test_passed: bool
    test_attempts: int


class UserProgressResponse(BaseModel):
    user_id: UUID
    modules: List[ModuleProgress]

