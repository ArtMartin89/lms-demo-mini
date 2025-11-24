from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Module, User, TestAttempt
from app.schemas import TestResponse, TestSubmission, TestResult, TestQuestion
from app.auth import get_current_user
from app.storage_service import storage_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_course_id_for_module(db: Session, module_id: str) -> str:
    """Get course_id for a module"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return None
    return str(module.course_id)


@router.get("/modules/{module_id}/test", response_model=TestResponse)
async def get_test(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get test questions"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get questions and settings from storage
    questions_data = storage_service.get_test_questions(course_id, module_id)
    settings_data = storage_service.get_test_settings(course_id, module_id)

    if not questions_data:
        raise HTTPException(status_code=404, detail="Test not found")

    # Convert to response format
    questions = []
    for q in questions_data.get("questions", []):
        question = TestQuestion(
            id=q["id"],
            type=q["type"],
            question=q["question"],
            options=q.get("options"),
            points=q.get("points", 1)
        )
        questions.append(question)

    settings = settings_data or {
        "passing_threshold": 0.7,
        "time_limit_minutes": 30,
        "max_attempts": 3,
        "shuffle_questions": False,
        "show_results_immediately": True,
        "allow_review": True
    }

    return TestResponse(
        module_id=module_id,
        questions=questions,
        settings=settings
    )


@router.post("/modules/{module_id}/test/submit", response_model=TestResult)
async def submit_test(
    module_id: str,
    submission: TestSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit test answers"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course_id = get_course_id_for_module(db, module_id)
    if not course_id:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get test questions
    questions_data = storage_service.get_test_questions(course_id, module_id)
    settings_data = storage_service.get_test_settings(course_id, module_id)

    if not questions_data:
        raise HTTPException(status_code=404, detail="Test not found")

    settings = settings_data or {"passing_threshold": 0.7}

    # Calculate score
    questions = questions_data.get("questions", [])
    score = 0.0
    max_score = sum(q.get("points", 1) for q in questions)

    # Create answer map
    answer_map = {ans.question_id: ans.answer for ans in submission.answers}

    # Check answers
    for q in questions:
        q_id = q["id"]
        user_answer = answer_map.get(q_id)
        correct_answer = q.get("correct_answer")

        if q["type"] == "multiple_choice":
            if isinstance(correct_answer, list):
                if isinstance(user_answer, list):
                    if set(user_answer) == set(correct_answer):
                        score += q.get("points", 1)
                elif user_answer in correct_answer:
                    score += q.get("points", 1) * 0.5  # Partial credit
            else:
                if user_answer == correct_answer:
                    score += q.get("points", 1)
        elif q["type"] == "text":
            if user_answer and correct_answer:
                # Simple text comparison (case-insensitive)
                if str(user_answer).strip().lower() == str(correct_answer).strip().lower():
                    score += q.get("points", 1)

    percentage = (score / max_score * 100) if max_score > 0 else 0
    passing_threshold = settings.get("passing_threshold", 0.7) * 100
    passed = percentage >= passing_threshold

    # Get attempt number
    existing_attempts = db.query(TestAttempt).filter(
        TestAttempt.user_id == current_user.id,
        TestAttempt.module_id == module_id
    ).count()

    # Log suspicious activity
    suspicious = {}
    if submission.suspicious_activity:
        suspicious = submission.suspicious_activity
        logger.warning(f"Suspicious activity for user {current_user.id}: {suspicious}")

    # Create test attempt
    attempt = TestAttempt(
        user_id=current_user.id,
        module_id=module_id,
        attempt_number=existing_attempts + 1,
        score=score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        answers={ans.question_id: ans.answer for ans in submission.answers},
        time_spent_seconds=submission.time_spent_seconds,
        submitted_at=datetime.utcnow(),
        suspicious_activity=suspicious
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return TestResult(
        attempt_id=attempt.id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        passed=attempt.passed,
        submitted_at=attempt.submitted_at,
        time_spent_seconds=attempt.time_spent_seconds,
        suspicious_activity=attempt.suspicious_activity
    )


@router.get("/modules/{module_id}/test/results", response_model=TestResult)
async def get_test_results(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get latest test results for user"""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.user_id == current_user.id,
        TestAttempt.module_id == module_id
    ).order_by(TestAttempt.submitted_at.desc()).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="No test results found")

    return TestResult(
        attempt_id=attempt.id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        passed=attempt.passed,
        submitted_at=attempt.submitted_at,
        time_spent_seconds=attempt.time_spent_seconds,
        suspicious_activity=attempt.suspicious_activity
    )

