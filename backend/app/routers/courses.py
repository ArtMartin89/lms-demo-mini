from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Course, Module, User
from app.schemas import CourseResponse, ModuleResponse
from app.auth import get_current_user

router = APIRouter()


@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active courses"""
    courses = db.query(Course).filter(Course.is_active == True).order_by(Course.order_index).all()
    return courses


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course details"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("/courses/{course_id}/modules", response_model=List[ModuleResponse])
async def get_course_modules(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get modules for a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    modules = db.query(Module).filter(
        Module.course_id == course_id,
        Module.is_active == True
    ).order_by(Module.order_index).all()
    return modules

