from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Lesson, Module, User, UserProgress
from app.schemas import LessonContentResponse, LessonResponse
from app.auth import get_current_user
from app.storage_service import storage_service
from datetime import datetime
import uuid

router = APIRouter()


def get_course_id_for_module(db: Session, module_id: str) -> str:
    """Get course_id for a module"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return None
    return str(module.course_id)


@router.get("/modules/{module_id}/lessons/{lesson_number}", response_model=LessonContentResponse)
async def get_lesson(
    module_id: str,
    lesson_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lesson content"""
    # Get lesson from DB
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Get course_id
    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get content from storage
    content = storage_service.get_lesson_content(course_id, module_id, lesson.id)
    if content is None:
        content = "# Lesson content not found"

    # Get next lesson
    next_lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number + 1
    ).first()

    # Mark lesson as accessed (create progress entry if not exists)
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.module_id == module_id,
        UserProgress.lesson_id == lesson.id
    ).first()

    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            module_id=module_id,
            lesson_id=lesson.id,
            lesson_number=lesson_number,
            is_completed=False
        )
        db.add(progress)
        db.commit()

    return LessonContentResponse(
        lesson=lesson,
        content=content,
        next_lesson=next_lesson
    )


@router.post("/modules/{module_id}/lessons/{lesson_number}/complete")
async def complete_lesson(
    module_id: str,
    lesson_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark lesson as completed"""
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.module_id == module_id,
        UserProgress.lesson_id == lesson.id
    ).first()

    if progress:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
    else:
        progress = UserProgress(
            user_id=current_user.id,
            module_id=module_id,
            lesson_id=lesson.id,
            lesson_number=lesson_number,
            is_completed=True,
            completed_at=datetime.utcnow()
        )
        db.add(progress)

    db.commit()
    return {"message": "Lesson completed", "lesson_id": lesson.id}

