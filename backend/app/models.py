from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="student")  # student, creator, hr
    is_superuser = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    progress = relationship("UserProgress", back_populates="user")
    test_attempts = relationship("TestAttempt", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    modules = relationship("Module", back_populates="course", order_by="Module.order_index")


class Module(Base):
    __tablename__ = "modules"

    id = Column(String, primary_key=True)  # e.g., "Company_Module_01"
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    total_lessons = Column(Integer, default=3)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order_index")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String, primary_key=True)  # e.g., "Company_Module_01_Lesson_01"
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    lesson_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    module = relationship("Module", back_populates="lessons")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    lesson_id = Column(String, ForeignKey("lessons.id"), nullable=True)
    lesson_number = Column(Integer, nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="progress")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    attempt_number = Column(Integer, default=1)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    passed = Column(Boolean, default=False)
    answers = Column(JSON, nullable=False)  # Store user answers
    time_spent_seconds = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    suspicious_activity = Column(JSON, nullable=True)  # Track tab switches, etc.

    user = relationship("User", back_populates="test_attempts")

