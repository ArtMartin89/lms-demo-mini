from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProgress, Module, Lesson, TestAttempt
from app.schemas import UserProgressResponse, ModuleProgress, LessonProgress
from app.auth import get_current_user

router = APIRouter()


@router.get("/progress", response_model=UserProgressResponse)
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall user progress"""
    # Get all modules
    modules = db.query(Module).filter(Module.is_active == True).order_by(Module.order_index).all()

    module_progresses = []
    for module in modules:
        # Get lesson progress
        lesson_progresses = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.module_id == module.id,
            UserProgress.lesson_id.isnot(None)
        ).all()

        completed_lessons = sum(1 for lp in lesson_progresses if lp.is_completed)
        total_lessons = module.total_lessons
        progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0

        # Get lessons
        lessons = db.query(Lesson).filter(
            Lesson.module_id == module.id
        ).order_by(Lesson.order_index).all()

        lesson_progress_list = []
        for lesson in lessons:
            lp = next((l for l in lesson_progresses if l.lesson_id == lesson.id), None)
            lesson_progress_list.append(LessonProgress(
                lesson_id=lesson.id,
                lesson_number=lesson.lesson_number,
                is_completed=lp.is_completed if lp else False,
                completed_at=lp.completed_at if lp else None
            ))

        # Check if test passed
        test_attempt = db.query(TestAttempt).filter(
            TestAttempt.user_id == current_user.id,
            TestAttempt.module_id == module.id,
            TestAttempt.passed == True
        ).first()

        test_attempts_count = db.query(TestAttempt).filter(
            TestAttempt.user_id == current_user.id,
            TestAttempt.module_id == module.id
        ).count()

        module_progresses.append(ModuleProgress(
            module_id=module.id,
            completed_lessons=completed_lessons,
            total_lessons=total_lessons,
            progress_percentage=progress_percentage,
            lessons=lesson_progress_list,
            test_passed=test_attempt is not None,
            test_attempts=test_attempts_count
        ))

    return UserProgressResponse(
        user_id=current_user.id,
        modules=module_progresses
    )


@router.get("/progress/{module_id}", response_model=ModuleProgress)
async def get_module_progress(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress for specific module"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Get lesson progress
    lesson_progresses = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.module_id == module_id,
        UserProgress.lesson_id.isnot(None)
    ).all()

    completed_lessons = sum(1 for lp in lesson_progresses if lp.is_completed)
    total_lessons = module.total_lessons
    progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0

    # Get lessons
    lessons = db.query(Lesson).filter(
        Lesson.module_id == module_id
    ).order_by(Lesson.order_index).all()

    lesson_progress_list = []
    for lesson in lessons:
        lp = next((l for l in lesson_progresses if l.lesson_id == lesson.id), None)
        lesson_progress_list.append(LessonProgress(
            lesson_id=lesson.id,
            lesson_number=lesson.lesson_number,
            is_completed=lp.is_completed if lp else False,
            completed_at=lp.completed_at if lp else None
        ))

    # Check if test passed
    test_attempt = db.query(TestAttempt).filter(
        TestAttempt.user_id == current_user.id,
        TestAttempt.module_id == module_id,
        TestAttempt.passed == True
    ).first()

    test_attempts_count = db.query(TestAttempt).filter(
        TestAttempt.user_id == current_user.id,
        TestAttempt.module_id == module_id
    ).count()

    return ModuleProgress(
        module_id=module_id,
        completed_lessons=completed_lessons,
        total_lessons=total_lessons,
        progress_percentage=progress_percentage,
        lessons=lesson_progress_list,
        test_passed=test_attempt is not None,
        test_attempts=test_attempts_count
    )

