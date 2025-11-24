import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../App.css';

function TestResults() {
  const { moduleId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [moduleId]);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/modules/${moduleId}/test/results`);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
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

  if (!results) {
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
            <p>Результаты не найдены</p>
            <Link to={`/modules/${moduleId}`}>Вернуться к модулю</Link>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} мин ${secs} сек`;
  };

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>LMS MVP - Результаты теста</h1>
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
          <h2>Результаты теста</h2>
          <div style={{ fontSize: '24px', margin: '20px 0' }}>
            <strong>
              Баллы: {results.score.toFixed(1)} / {results.max_score.toFixed(1)} (
              {results.percentage.toFixed(1)}%)
            </strong>
          </div>
          <div
            style={{
              padding: '15px',
              borderRadius: '5px',
              backgroundColor: results.passed ? '#d4edda' : '#f8d7da',
              color: results.passed ? '#155724' : '#721c24',
              margin: '20px 0',
            }}
          >
            {results.passed ? (
              <strong>✅ Тест пройден!</strong>
            ) : (
              <strong>❌ Тест не пройден</strong>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <p>
              <strong>Время прохождения:</strong> {formatTime(results.time_spent_seconds)}
            </p>
            <p>
              <strong>Дата прохождения:</strong>{' '}
              {new Date(results.submitted_at).toLocaleString('ru-RU')}
            </p>

            {results.suspicious_activity && Object.keys(results.suspicious_activity).length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <strong>Зафиксированная активность:</strong>
                <ul>
                  {results.suspicious_activity.tab_switches > 0 && (
                    <li>Переключений вкладок: {results.suspicious_activity.tab_switches}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/modules/${moduleId}`)}
          >
            Вернуться к модулю
          </button>
          {!results.passed && (
            <button
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
              onClick={() => navigate(`/modules/${moduleId}/test`)}
            >
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestResults;

