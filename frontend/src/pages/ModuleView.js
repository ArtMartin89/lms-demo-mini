import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../App.css';

function ModuleView() {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsData, setLessonsData] = useState([]); // Full lesson data with titles
  const [progress, setProgress] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [moduleId, user]);

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

      // Get lessons with titles
      let lessonsWithTitles = [];
      try {
        const lessonsRes = await api.get(`/modules/${moduleId}/lessons`);
        lessonsWithTitles = lessonsRes.data || [];
      } catch (error) {
        console.error('Error fetching lessons with titles:', error);
      }

      // Get lessons from progress or create from module
      if (progressRes.data.lessons && progressRes.data.lessons.length > 0) {
        setLessons(progressRes.data.lessons);
        
        // Merge with titles if available
        if (lessonsWithTitles.length > 0) {
          const mergedLessons = progressRes.data.lessons.map(lesson => {
            const lessonWithTitle = lessonsWithTitles.find(l => l.lesson_number === lesson.lesson_number);
            return {
              ...lesson,
              title: lessonWithTitle?.title || `Урок ${lesson.lesson_number}`,
              id: lessonWithTitle?.id || lesson.lesson_id
            };
          });
          setLessonsData(mergedLessons);
        } else {
          setLessonsData(progressRes.data.lessons.map(lesson => ({
            ...lesson,
            title: `Урок ${lesson.lesson_number}`
          })));
        }
      } else {
        // Create lesson list from module info
        const lessonList = [];
        for (let i = 1; i <= moduleRes.data.total_lessons; i++) {
          const lessonId = `${moduleId}_Lesson_${i.toString().padStart(2, '0')}`;
          const lessonWithTitle = lessonsWithTitles.find(l => l.lesson_number === i);
          lessonList.push({
            lesson_id: lessonId,
            id: lessonWithTitle?.id || lessonId,
            lesson_number: i,
            title: lessonWithTitle?.title || `Урок ${i}`,
            is_completed: false,
            completed_at: null
          });
        }
        setLessons(lessonList);
        setLessonsData(lessonList);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonNumber, e) => {
    // Don't navigate if clicking on edit button or input
    if (e && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT')) {
      return;
    }
    navigate(`/modules/${moduleId}/lessons/${lessonNumber}`);
  };

  const handleStartEdit = (lesson, e) => {
    e.stopPropagation();
    setEditingLessonId(lesson.id || lesson.lesson_id);
    setEditingTitle(lesson.title || `Урок ${lesson.lesson_number}`);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingLessonId(null);
    setEditingTitle('');
  };

  const handleSaveTitle = async (lesson, e) => {
    e.stopPropagation();
    if (!user?.is_superuser) return;

    setSaving(true);
    try {
      await api.put(`/admin/modules/${moduleId}/lessons/${lesson.lesson_number}`, {
        title: editingTitle,
      });

      // Update local state
      setLessonsData(lessonsData.map(l => 
        (l.id === lesson.id || l.lesson_id === lesson.lesson_id)
          ? { ...l, title: editingTitle }
          : l
      ));
      setEditingLessonId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error saving lesson title:', error);
      alert('Ошибка сохранения названия урока');
    } finally {
      setSaving(false);
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
          {lessonsData.map((lesson) => {
            const isEditing = editingLessonId === (lesson.id || lesson.lesson_id);
            return (
              <li
                key={lesson.id || lesson.lesson_id}
                className={`lesson-item ${lesson.is_completed ? 'completed' : ''}`}
                onClick={(e) => handleLessonClick(lesson.lesson_number, e)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {lesson.is_completed && <span className="checkmark">✓</span>}
                  {isEditing && user?.is_superuser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveTitle(lesson, e);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit(e);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: '16px',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                        }}
                        autoFocus
                      />
                      <button
                        className="btn btn-primary"
                        onClick={(e) => handleSaveTitle(lesson, e)}
                        disabled={saving}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        {saving ? '...' : '✓'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="lesson-title">
                      {lesson.title || `Урок ${lesson.lesson_number}`}
                    </span>
                  )}
                  {!isEditing && user?.is_superuser && (
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => handleStartEdit(lesson, e)}
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        marginLeft: 'auto',
                        opacity: 0.7
                      }}
                      title="Редактировать название"
                    >
                      ✏️
                    </button>
                  )}
                </div>
                {lesson.is_completed && !isEditing && <span>Завершен</span>}
              </li>
            );
          })}
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

