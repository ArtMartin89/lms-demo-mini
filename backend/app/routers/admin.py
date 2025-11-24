from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Lesson, Module, User
from app.schemas import LessonResponse, LessonContentResponse
from app.auth import get_current_admin_user
from app.storage_service import storage_service
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import os

router = APIRouter()


def get_course_id_for_module(db: Session, module_id: str) -> str:
    """Get course_id for a module"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return None
    return str(module.course_id)


class LessonUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class TestQuestionUpdate(BaseModel):
    id: str
    type: str
    question: str
    options: Optional[List[Dict[str, str]]] = None
    correct_answer: Any  # str or List[str]
    points: int = 1
    explanation: Optional[str] = None


class TestUpdateRequest(BaseModel):
    questions: List[TestQuestionUpdate]
    settings: Optional[Dict[str, Any]] = None


class ModuleUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


@router.get("/admin/modules/{module_id}")
async def get_module_for_edit(
    module_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get module for editing (admin only)"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@router.put("/admin/modules/{module_id}")
async def update_module(
    module_id: str,
    update_data: ModuleUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update module title and/or description (admin only)"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if update_data.title is not None:
        module.title = update_data.title
        module.updated_at = datetime.utcnow()

    if update_data.description is not None:
        module.description = update_data.description
        module.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(module)

    return {
        "message": "Module updated successfully",
        "module": module
    }


@router.get("/admin/modules/{module_id}/lessons")
async def get_module_lessons(
    module_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get list of lessons for a module (admin only)"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    lessons = db.query(Lesson).filter(
        Lesson.module_id == module_id
    ).order_by(Lesson.lesson_number).all()

    return {
        "module_id": module_id,
        "module_title": module.title,
        "lessons": lessons
    }


@router.get("/admin/modules/{module_id}/lessons/{lesson_number}", response_model=LessonContentResponse)
async def get_lesson_for_edit(
    module_id: str,
    lesson_number: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get lesson for editing (admin only)"""
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    content = storage_service.get_lesson_content(course_id, module_id, lesson.id)
    if content is None:
        content = ""

    return {
        "lesson": lesson,
        "content": content
    }


@router.put("/admin/modules/{module_id}/lessons/{lesson_number}")
async def update_lesson(
    module_id: str,
    lesson_number: int,
    update_data: LessonUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update lesson title and/or content (admin only)"""
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    # Update title in DB if provided
    if update_data.title is not None:
        lesson.title = update_data.title
        lesson.updated_at = datetime.utcnow()

    # Update content in storage if provided
    if update_data.content is not None:
        success = storage_service.save_lesson_content(course_id, module_id, lesson.id, update_data.content)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save lesson content")

    db.commit()
    db.refresh(lesson)

    return {
        "message": "Lesson updated successfully",
        "lesson": lesson
    }


@router.get("/admin/modules/{module_id}/test")
async def get_test_for_edit(
    module_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get test for editing (admin only)"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    questions_data = storage_service.get_test_questions(course_id, module_id)
    settings_data = storage_service.get_test_settings(course_id, module_id)

    if not questions_data:
        questions_data = {"module_id": module_id, "questions": []}
    if not settings_data:
        settings_data = {
            "module_id": module_id,
            "passing_threshold": 0.7,
            "time_limit_minutes": 30,
            "max_attempts": 3,
            "shuffle_questions": False,
            "show_results_immediately": True,
            "allow_review": True
        }

    return {
        "module_id": module_id,
        "questions": questions_data.get("questions", []),
        "settings": settings_data
    }


@router.put("/admin/modules/{module_id}/test")
async def update_test(
    module_id: str,
    update_data: TestUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update test questions and settings (admin only)"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    # Prepare questions data
    questions_list = []
    for q in update_data.questions:
        q_dict = q.dict()
        # Ensure correct_answer is in the right format
        if isinstance(q_dict.get("correct_answer"), str):
            q_dict["correct_answer"] = [q_dict["correct_answer"]]
        elif not isinstance(q_dict.get("correct_answer"), list):
            q_dict["correct_answer"] = []
        questions_list.append(q_dict)
    
    questions_data = {
        "module_id": module_id,
        "questions": questions_list
    }

    # Save questions
    success = storage_service.save_test_questions(course_id, module_id, questions_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save test questions")

    # Save settings if provided
    if update_data.settings:
        settings_data = {
            "module_id": module_id,
            **update_data.settings
        }
        success = storage_service.save_test_settings(course_id, module_id, settings_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save test settings")

    return {
        "message": "Test updated successfully",
        "module_id": module_id
    }


@router.post("/admin/modules/{module_id}/lessons/{lesson_number}/video")
async def upload_video(
    module_id: str,
    lesson_number: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload video file for lesson (admin only)"""
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    filename = storage_service.save_video_file(course_id, module_id, lesson.id, file)
    if not filename:
        raise HTTPException(status_code=400, detail="Failed to save video file")

    return {
        "message": "Video uploaded successfully",
        "filename": filename
    }


@router.get("/admin/modules/{module_id}/lessons/{lesson_number}/videos")
async def list_lesson_videos(
    module_id: str,
    lesson_number: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List video files for lesson (admin only)"""
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    videos = storage_service.list_video_files(course_id, module_id, lesson.id)
    return {"videos": videos}


@router.delete("/admin/modules/{module_id}/lessons/{lesson_number}/video/{filename}")
async def delete_video(
    module_id: str,
    lesson_number: int,
    filename: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete video file (admin only)"""
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.lesson_number == lesson_number
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    success = storage_service.delete_video_file(course_id, module_id, lesson.id, filename)
    if not success:
        raise HTTPException(status_code=404, detail="Video file not found")

    return {"message": "Video deleted successfully"}

