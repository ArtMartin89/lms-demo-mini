"""
Script to initialize database with MVP data
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User, Course, Module, Lesson
from app.auth import get_password_hash
import uuid

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default admin user
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                id=uuid.uuid4(),
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                role="creator",
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            print("Created admin user: admin@example.com / admin123")
        
        # Create test user
        test_user = db.query(User).filter(User.email == "student@example.com").first()
        if not test_user:
            test_user = User(
                id=uuid.uuid4(),
                email="student@example.com",
                hashed_password=get_password_hash("student123"),
                full_name="Test Student",
                role="student",
                is_superuser=False,
                is_active=True
            )
            db.add(test_user)
            print("Created test user: student@example.com / student123")
        
        # Create course "Основы ИИ"
        course = db.query(Course).first()
        if not course:
            # Use fixed UUID to match storage structure
            course_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
            course = Course(
                id=course_id,
                title="Основы ИИ",
                description="Курс по основам искусственного интеллекта",
                order_index=1,
                is_active=True
            )
            db.add(course)
            db.flush()
            print(f"Created course: {course.title}")
            
            # Create 3 modules
            modules_data = [
                {
                    "id": "Company_Module_01",
                    "title": "Введение в ИИ",
                    "description": "Основные понятия и история искусственного интеллекта",
                    "total_lessons": 3,
                    "order_index": 1
                },
                {
                    "id": "Company_Module_02",
                    "title": "Машинное обучение",
                    "description": "Основы машинного обучения и нейронных сетей",
                    "total_lessons": 3,
                    "order_index": 2
                },
                {
                    "id": "Company_Module_03",
                    "title": "Применение ИИ",
                    "description": "Практические применения искусственного интеллекта",
                    "total_lessons": 3,
                    "order_index": 3
                }
            ]
            
            for mod_data in modules_data:
                module = Module(
                    id=mod_data["id"],
                    course_id=course_id,
                    title=mod_data["title"],
                    description=mod_data["description"],
                    total_lessons=mod_data["total_lessons"],
                    order_index=mod_data["order_index"],
                    is_active=True
                )
                db.add(module)
                db.flush()
                print(f"Created module: {module.title}")
                
                # Create 3 lessons for each module
                for lesson_num in range(1, 4):
                    lesson = Lesson(
                        id=f"{mod_data['id']}_Lesson_{lesson_num:02d}",
                        module_id=mod_data["id"],
                        lesson_number=lesson_num,
                        title=f"Урок {lesson_num}: {mod_data['title']}",
                        order_index=lesson_num,
                        is_active=True
                    )
                    db.add(lesson)
                    print(f"  Created lesson: {lesson.title}")
        
        db.commit()
        print("\nDatabase initialized successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

