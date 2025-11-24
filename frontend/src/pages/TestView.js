import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../App.css';

function TestView() {
  const { moduleId } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTest();
    setStartTime(Date.now());

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto-save answers
    const autoSaveInterval = setInterval(() => {
      // Auto-save to localStorage
      localStorage.setItem(`test_${moduleId}_answers`, JSON.stringify(answers));
    }, 30000); // Every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(autoSaveInterval);
    };
  }, [moduleId]);

  useEffect(() => {
    // Load saved answers
    const saved = localStorage.getItem(`test_${moduleId}_answers`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved answers:', e);
      }
    }
  }, [moduleId]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      const response = await api.get(`/modules/${moduleId}/test`);
      setTest(response.data);
      
      // Initialize answers
      const initialAnswers = {};
      response.data.questions.forEach((q) => {
        if (q.type === 'multiple_choice') {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
      
      // Timer setup
      if (response.data.settings?.time_limit_minutes) {
        const totalSeconds = response.data.settings.time_limit_minutes * 60;
        setTimeLeft(totalSeconds);
      }
    } catch (error) {
      console.error('Error fetching test:', error);
    }
  };

  const handleAnswerChange = (questionId, value, isMultiple = false) => {
    setAnswers((prev) => {
      if (isMultiple) {
        const current = prev[questionId] || [];
        if (current.includes(value)) {
          return {
            ...prev,
            [questionId]: current.filter((v) => v !== value),
          };
        } else {
          return {
            ...prev,
            [questionId]: [...current, value],
          };
        }
      } else {
        return {
          ...prev,
          [questionId]: value,
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      
      const submission = {
        answers: Object.entries(answers).map(([question_id, answer]) => ({
          question_id,
          answer,
        })),
        time_spent_seconds: timeSpent,
        suspicious_activity: {
          tab_switches: tabSwitches,
          time_spent: timeSpent,
        },
      };

      const response = await api.post(`/modules/${moduleId}/test/submit`, submission);
      
      // Clear saved answers
      localStorage.removeItem(`test_${moduleId}_answers`);
      
      navigate(`/modules/${moduleId}/test/results`);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Ошибка при отправке теста. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!test) {
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
          <h1>LMS MVP - Тест</h1>
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
        {tabSwitches > 0 && (
          <div className="warning-banner">
            ⚠️ Внимание: Вы переключали вкладки {tabSwitches} раз(а). Это может быть зафиксировано.
          </div>
        )}

        {timeLeft !== null && (
          <div className="card">
            <div className="timer">
              Осталось времени: {formatTime(timeLeft)}
            </div>
          </div>
        )}

        <div className="card">
          <h2>Тест модуля</h2>
          <p>Вопросов: {test.questions.length}</p>
          {test.settings.passing_threshold && (
            <p>
              Проходной балл: {(test.settings.passing_threshold * 100).toFixed(0)}%
            </p>
          )}
        </div>

        {test.questions.map((question, index) => (
          <div key={question.id} className="card test-question">
            <h3>
              Вопрос {index + 1} ({question.points} балл{question.points > 1 ? 'а' : ''})
            </h3>
            <p>{question.question}</p>

            {question.type === 'multiple_choice' && question.options && (
              <ul className="test-options">
                {question.options.map((option) => {
                  const isSelected = (answers[question.id] || []).includes(option.id);
                  return (
                    <li
                      key={option.id}
                      className={`test-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange(question.id, option.id, true)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAnswerChange(question.id, option.id, true)}
                      />
                      {option.text}
                    </li>
                  );
                })}
              </ul>
            )}

            {question.type === 'text' && (
              <textarea
                className="text-answer"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                rows="4"
                placeholder="Введите ваш ответ..."
              />
            )}
          </div>
        ))}

        <div className="card">
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', fontSize: '18px', padding: '15px' }}
          >
            {submitting ? 'Отправка...' : 'Завершить тест'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestView;

