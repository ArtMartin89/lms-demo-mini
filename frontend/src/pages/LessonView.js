import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import '../App.css';

function LessonView() {
  const { moduleId, lessonNumber } = useParams();
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLesson();
  }, [moduleId, lessonNumber]);

  const fetchLesson = async () => {
    try {
      const response = await api.get(
        `/modules/${moduleId}/lessons/${lessonNumber}`
      );
      setLesson(response.data.lesson);
      setContent(response.data.content);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/modules/${moduleId}/lessons/${lessonNumber}/complete`);
      // Navigate to next lesson or back to module
      if (lesson?.next_lesson) {
        navigate(`/modules/${moduleId}/lessons/${lesson.next_lesson.lesson_number}`);
      } else {
        navigate(`/modules/${moduleId}`);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setCompleting(false);
    }
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

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>LMS MVP</h1>
          <div className="header-actions">
            <Link to={`/modules/${moduleId}`} style={{ color: 'white', marginRight: '15px' }}>
              ← Модуль
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
          <h2>{lesson?.title}</h2>
          <div className="lesson-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          <div style={{ marginTop: '30px' }}>
            <button
              className="btn btn-success"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? 'Сохранение...' : 'Завершить урок'}
            </button>
            {lesson?.next_lesson && (
              <button
                className="btn btn-primary"
                style={{ marginLeft: '10px' }}
                onClick={() =>
                  navigate(
                    `/modules/${moduleId}/lessons/${lesson.next_lesson.lesson_number}`
                  )
                }
              >
                Следующий урок →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonView;

