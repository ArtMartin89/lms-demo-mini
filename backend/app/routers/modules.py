from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Module, User, UserProgress, Lesson
from app.schemas import ModuleResponse, LessonResponse
from typing import List
from app.auth import get_current_user
from datetime import datetime

router = APIRouter()


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get module information"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@router.post("/modules/{module_id}/start")
async def start_module(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start module - initialize progress"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Check if progress already exists
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.module_id == module_id
    ).first()

    if not existing:
        # Create initial progress entry
        progress = UserProgress(
            user_id=current_user.id,
            module_id=module_id,
            is_completed=False
        )
        db.add(progress)
        db.commit()

    return {"message": "Module started", "module_id": module_id}


@router.get("/modules/{module_id}/lessons", response_model=List[LessonResponse])
async def get_module_lessons(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of lessons for a module with titles"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    lessons = db.query(Lesson).filter(
        Lesson.module_id == module_id
    ).order_by(Lesson.lesson_number).all()

    return lessons

