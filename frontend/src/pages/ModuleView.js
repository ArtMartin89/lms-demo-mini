import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../App.css';

function ModuleView() {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [moduleId]);

  const fetchData = async () => {
    try {
      const [moduleRes, progressRes] = await Promise.all([
        api.get(`/modules/${moduleId}`),
        api.get(`/progress/${moduleId}`),
      ]);

      setModule(moduleRes.data);
      setProgress(progressRes.data);

      // Start module if not started
      try {
        await api.post(`/modules/${moduleId}/start`);
      } catch (error) {
        // Ignore if already started
      }

      // Get lessons from progress or create from module
      if (progressRes.data.lessons && progressRes.data.lessons.length > 0) {
        setLessons(progressRes.data.lessons);
      } else {
        // Create lesson list from module info
        const lessonList = [];
        for (let i = 1; i <= moduleRes.data.total_lessons; i++) {
          lessonList.push({
            lesson_id: `${moduleId}_Lesson_${i.toString().padStart(2, '0')}`,
            lesson_number: i,
            is_completed: false,
            completed_at: null
          });
        }
        setLessons(lessonList);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonNumber) => {
    navigate(`/modules/${moduleId}/lessons/${lessonNumber}`);
  };

  if (loading) {
    return (
      <div>
        <div className="header">
          <div className="header-content">
            <h1>LMS MVP</h1>
            <div className="header-actions">
              <span>{user?.email}</span>
              <button className="btn btn-secondary" onClick={logout}>
                Выйти
              </button>
            </div>
          </div>
        </div>
        <div className="container">Загрузка...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div>
        <div className="header">
          <div className="header-content">
            <h1>LMS MVP</h1>
            <div className="header-actions">
              <span>{user?.email}</span>
              <button className="btn btn-secondary" onClick={logout}>
                Выйти
              </button>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="card">
            <p>Модуль не найден</p>
            <Link to="/">Вернуться на главную</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>LMS MVP</h1>
          <div className="header-actions">
            <Link to="/" style={{ color: 'white', marginRight: '15px' }}>
              Главная
            </Link>
            <span>{user?.email}</span>
            <button className="btn btn-secondary" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <h2>{module.title}</h2>
          <p>{module.description}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress?.progress_percentage || 0}%` }}
            />
          </div>
          <p>
            Прогресс: {progress?.completed_lessons || 0} / {progress?.total_lessons || 0} уроков
          </p>
        </div>

        <h2 style={{ marginBottom: '20px' }}>Уроки</h2>
        <ul className="lesson-list">
          {lessons.map((lesson) => (
            <li
              key={lesson.lesson_id}
              className={`lesson-item ${lesson.is_completed ? 'completed' : ''}`}
              onClick={() => handleLessonClick(lesson.lesson_number)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                {lesson.is_completed && <span className="checkmark">✓</span>}
                <span className="lesson-title">
                  Урок {lesson.lesson_number}
                </span>
              </div>
              {lesson.is_completed && <span>Завершен</span>}
            </li>
          ))}
        </ul>

        <div className="card" style={{ marginTop: '30px' }}>
          <h3>Тест модуля</h3>
          <p>
            {progress?.test_passed
              ? '✅ Тест пройден'
              : `Попыток: ${progress?.test_attempts || 0}`}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/modules/${moduleId}/test`)}
          >
            {progress?.test_passed ? 'Посмотреть результаты' : 'Пройти тест'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModuleView;

