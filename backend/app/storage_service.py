import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List, BinaryIO
import logging

logger = logging.getLogger(__name__)

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")

# Allowed video file extensions
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB


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

    def _get_lesson_files_path(self, course_id: str, module_id: str, lesson_id: str, file_type: str) -> Path:
        """Get path for lesson files (video, audio, images, attachments)"""
        return self._get_lesson_path(course_id, module_id, lesson_id) / "files" / file_type

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

    def save_video_file(self, course_id: str, module_id: str, lesson_id: str, file) -> Optional[str]:
        """Save video file and return filename"""
        try:
            # Check file extension
            file_ext = Path(file.filename).suffix.lower()
            if file_ext not in ALLOWED_VIDEO_EXTENSIONS:
                logger.error(f"Invalid video file extension: {file_ext}")
                return None

            # Create files/video directory
            video_path = self._get_lesson_files_path(course_id, module_id, lesson_id, "video")
            video_path.mkdir(parents=True, exist_ok=True)

            # Generate filename
            existing_files = list(video_path.glob(f"{lesson_id}_video_*.{file_ext[1:]}"))
            index = len(existing_files) + 1
            filename = f"{lesson_id}_video_{index}{file_ext}"

            # Save file
            file_path = video_path / filename
            with open(file_path, "wb") as f:
                content = file.file.read()
                # Check file size
                if len(content) > MAX_VIDEO_SIZE:
                    logger.error(f"Video file too large: {len(content)} bytes")
                    return None
                f.write(content)

            return filename
        except Exception as e:
            logger.error(f"Error saving video file: {e}")
            return None

    def get_video_file_path(self, course_id: str, module_id: str, lesson_id: str, filename: str) -> Optional[Path]:
        """Get path to video file"""
        video_path = self._get_lesson_files_path(course_id, module_id, lesson_id, "video")
        file_path = video_path / filename
        if file_path.exists() and file_path.is_file():
            return file_path
        return None

    def list_video_files(self, course_id: str, module_id: str, lesson_id: str) -> List[str]:
        """List all video files for a lesson"""
        try:
            video_path = self._get_lesson_files_path(course_id, module_id, lesson_id, "video")
            if not video_path.exists():
                return []
            
            video_files = []
            for file_path in video_path.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ALLOWED_VIDEO_EXTENSIONS:
                    video_files.append(file_path.name)
            
            return sorted(video_files)
        except Exception as e:
            logger.error(f"Error listing video files: {e}")
            return []

    def delete_video_file(self, course_id: str, module_id: str, lesson_id: str, filename: str) -> bool:
        """Delete video file"""
        try:
            video_path = self._get_lesson_files_path(course_id, module_id, lesson_id, "video")
            file_path = video_path / filename
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting video file: {e}")
            return False


storage_service = StorageService()

