import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")


class StorageService:
    def __init__(self, storage_path: str = STORAGE_PATH):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def _get_course_path(self, course_id: str) -> Path:
        return self.storage_path / "courses" / course_id

    def _get_module_path(self, course_id: str, module_id: str) -> Path:
        return self._get_course_path(course_id) / "modules" / module_id

    def _get_lesson_path(self, course_id: str, module_id: str, lesson_id: str) -> Path:
        return self._get_module_path(course_id, module_id) / "lessons" / lesson_id

    def _get_test_path(self, course_id: str, module_id: str) -> Path:
        return self._get_module_path(course_id, module_id) / "test"

    def get_course_metadata(self, course_id: str) -> Optional[Dict[str, Any]]:
        metadata_file = self._get_course_path(course_id) / "metadata.json"
        if not metadata_file.exists():
            return None
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading course metadata: {e}")
            return None

    def get_module_metadata(self, course_id: str, module_id: str) -> Optional[Dict[str, Any]]:
        metadata_file = self._get_module_path(course_id, module_id) / "metadata.json"
        if not metadata_file.exists():
            return None
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading module metadata: {e}")
            return None

    def get_lesson_content(self, course_id: str, module_id: str, lesson_id: str) -> Optional[str]:
        content_file = self._get_lesson_path(course_id, module_id, lesson_id) / "content.md"
        if not content_file.exists():
            return None
        try:
            with open(content_file, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading lesson content: {e}")
            return None

    def get_test_questions(self, course_id: str, module_id: str) -> Optional[Dict[str, Any]]:
        questions_file = self._get_test_path(course_id, module_id) / "questions.json"
        if not questions_file.exists():
            return None
        try:
            with open(questions_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading test questions: {e}")
            return None

    def get_test_settings(self, course_id: str, module_id: str) -> Optional[Dict[str, Any]]:
        settings_file = self._get_test_path(course_id, module_id) / "settings.json"
        if not settings_file.exists():
            return None
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading test settings: {e}")
            return None

    def save_lesson_content(self, course_id: str, module_id: str, lesson_id: str, content: str) -> bool:
        """Save lesson content to file"""
        try:
            lesson_path = self._get_lesson_path(course_id, module_id, lesson_id)
            lesson_path.mkdir(parents=True, exist_ok=True)
            content_file = lesson_path / "content.md"
            with open(content_file, "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception as e:
            logger.error(f"Error saving lesson content: {e}")
            return False

    def save_test_questions(self, course_id: str, module_id: str, questions: Dict[str, Any]) -> bool:
        """Save test questions to file"""
        try:
            test_path = self._get_test_path(course_id, module_id)
            test_path.mkdir(parents=True, exist_ok=True)
            questions_file = test_path / "questions.json"
            with open(questions_file, "w", encoding="utf-8") as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving test questions: {e}")
            return False

    def save_test_settings(self, course_id: str, module_id: str, settings: Dict[str, Any]) -> bool:
        """Save test settings to file"""
        try:
            test_path = self._get_test_path(course_id, module_id)
            test_path.mkdir(parents=True, exist_ok=True)
            settings_file = test_path / "settings.json"
            with open(settings_file, "w", encoding="utf-8") as f:
                json.dump(settings, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving test settings: {e}")
            return False


storage_service = StorageService()

