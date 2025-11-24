import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../App.css';

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, progressRes] = await Promise.all([
        api.get('/courses'),
        api.get('/progress'),
      ]);
      
      setCourses(coursesRes.data);
      if (coursesRes.data.length > 0) {
        const courseId = coursesRes.data[0].id;
        // Get modules from course
        const modulesRes = await api.get(`/courses/${courseId}/modules`);
        setModules(modulesRes.data);
      }
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debug: log user info
  useEffect(() => {
    if (user) {
      console.log('User data:', user);
      console.log('is_superuser:', user.is_superuser);
    }
  }, [user]);

  const handleModuleClick = (moduleId) => {
    navigate(`/modules/${moduleId}`);
  };

  if (loading) {
    return (
      <div>
        <div className="header">
          <div className="header-content">
            <h1>LMS MVP - Основы ИИ</h1>
            <div className="header-actions">
              {user?.is_superuser && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigate('/admin/modules/Company_Module_01/edit');
                  }}
                  style={{ marginRight: '10px' }}
                >
                  Редактор
                </button>
              )}
              <span>Привет, {user?.full_name || user?.email}</span>
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
          <h1>LMS MVP - Основы ИИ</h1>
          <div className="header-actions">
            {user?.is_superuser && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (modules.length > 0) {
                    navigate(`/admin/modules/${modules[0].id}/edit`);
                  } else {
                    // Navigate to admin editor, it will handle module selection
                    navigate('/admin/modules/Company_Module_01/edit');
                  }
                }}
                style={{ marginRight: '10px' }}
              >
                Редактор
              </button>
            )}
            <span>Привет, {user?.full_name || user?.email}</span>
            <button className="btn btn-secondary" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {courses.length > 0 && (
          <div className="card">
            <h2>{courses[0].title}</h2>
            <p>{courses[0].description}</p>
          </div>
        )}

        <h2 style={{ marginBottom: '20px' }}>Модули</h2>
        {modules.map((module) => {
          const moduleProgress = progress?.modules?.find((m) => m.module_id === module.id) || {
            progress_percentage: 0,
            test_passed: false,
          };

          return (
            <div
              key={module.id}
              className="card module-card"
              onClick={() => handleModuleClick(module.id)}
            >
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${moduleProgress.progress_percentage}%` }}
                />
              </div>
              <p>
                Прогресс: {moduleProgress.progress_percentage.toFixed(0)}% |{' '}
                {moduleProgress.test_passed ? '✅ Тест пройден' : '⏳ Тест не пройден'}
              </p>
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="card">
            <p>Модули не найдены. Обратитесь к администратору.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

