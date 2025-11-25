import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../App.css';

function AdminEditor() {
  const { moduleId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideos, setLessonVideos] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [testData, setTestData] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' or 'test'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupHiding, setPopupHiding] = useState(false);
  const contentTextareaRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoursesAndModules();
  }, []);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData(moduleId);
    }
  }, [moduleId]);

  const fetchCoursesAndModules = async () => {
    try {
      const coursesRes = await api.get('/courses');
      if (coursesRes.data.length > 0) {
        const courseId = coursesRes.data[0].id;
        setCourse(coursesRes.data[0]);
        const modulesRes = await api.get(`/courses/${courseId}/modules`);
        setModules(modulesRes.data);
        
        // If moduleId is provided, set it as current
        if (moduleId && modulesRes.data.find(m => m.id === moduleId)) {
          fetchModuleData(moduleId);
        } else if (modulesRes.data.length > 0 && !moduleId) {
          // Navigate to first module if no moduleId provided
          navigate(`/admin/modules/${modulesRes.data[0].id}/edit`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleData = async (mId) => {
    try {
      const [moduleRes, lessonsRes] = await Promise.all([
        api.get(`/admin/modules/${mId}`),
        api.get(`/admin/modules/${mId}/lessons`),
      ]);

      setCurrentModule(moduleRes.data);
      setModuleTitle(moduleRes.data.title || '');
      setModuleDescription(moduleRes.data.description || '');
      setLessons(lessonsRes.data.lessons || []);
    } catch (error) {
      console.error('Error fetching module data:', error);
      if (error.response?.status === 403) {
        setMessage('У вас нет прав администратора');
      }
    }
  };

  const handleModuleChange = (newModuleId) => {
    navigate(`/admin/modules/${newModuleId}/edit`);
  };

  const handleLessonSelect = async (lessonNumber) => {
    try {
      const [lessonRes, videosRes] = await Promise.all([
        api.get(`/admin/modules/${moduleId}/lessons/${lessonNumber}`),
        api.get(`/admin/modules/${moduleId}/lessons/${lessonNumber}/videos`).catch(() => ({ data: { videos: [] } }))
      ]);
      const data = lessonRes.data;
      setSelectedLesson(data.lesson);
      setLessonTitle(data.lesson.title);
      setLessonContent(data.content || '');
      setLessonVideos(videosRes.data.videos || []);
      setActiveTab('lessons');
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setMessage('Ошибка загрузки урока');
    }
  };

  const handleVideoUpload = async (e) => {
    if (!selectedLesson || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingVideo(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/admin/modules/${moduleId}/lessons/${selectedLesson.lesson_number}/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage('Видео успешно загружено');
      // Refresh video list
      const videosRes = await api.get(`/admin/modules/${moduleId}/lessons/${selectedLesson.lesson_number}/videos`);
      setLessonVideos(videosRes.data.videos || []);
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage('Ошибка загрузки видео: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async (filename) => {
    if (!selectedLesson || !window.confirm(`Удалить видео "${filename}"?`)) return;

    try {
      await api.delete(`/admin/modules/${moduleId}/lessons/${selectedLesson.lesson_number}/video/${filename}`);
      setMessage('Видео удалено');
      // Refresh video list
      const videosRes = await api.get(`/admin/modules/${moduleId}/lessons/${selectedLesson.lesson_number}/videos`);
      setLessonVideos(videosRes.data.videos || []);
    } catch (error) {
      console.error('Error deleting video:', error);
      setMessage('Ошибка удаления видео');
    }
  };

  const handleInsertVideo = (filename) => {
    if (!contentTextareaRef.current) return;
    
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = lessonContent.substring(0, start);
    const textAfter = lessonContent.substring(end);
    
    // Insert video tag at cursor position
    const videoTag = `[VIDEO:${filename}]`;
    const newContent = textBefore + videoTag + textAfter;
    
    setLessonContent(newContent);
    
    // Set cursor position after inserted video tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + videoTag.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTestSelect = async () => {
    try {
      const response = await api.get(`/admin/modules/${moduleId}/test`);
      setTestData(response.data);
      setActiveTab('test');
      setSelectedLesson(null);
    } catch (error) {
      console.error('Error fetching test:', error);
      setMessage('Ошибка загрузки теста');
    }
  };

  const handleSaveModule = async () => {
    if (!currentModule) return;

    setSaving(true);
    setMessage('');

    try {
      await api.put(`/admin/modules/${moduleId}`, {
        title: moduleTitle,
        description: moduleDescription,
      });

      setMessage('Модуль успешно сохранен');
      
      // Update module in list and current module
      setModules(modules.map(m => 
        m.id === moduleId 
          ? { ...m, title: moduleTitle, description: moduleDescription }
          : m
      ));
      setCurrentModule({ ...currentModule, title: moduleTitle, description: moduleDescription });
    } catch (error) {
      console.error('Error saving module:', error);
      setMessage('Ошибка сохранения модуля: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;

    setSaving(true);
    setMessage('');

    try {
      await api.put(`/admin/modules/${moduleId}/lessons/${selectedLesson.lesson_number}`, {
        title: lessonTitle,
        content: lessonContent,
      });

      // Show popup instead of regular message
      setPopupMessage('Урок успешно сохранен');
      setPopupHiding(false);
      setShowPopup(true);
      
      // Update lesson in list
      setLessons(lessons.map(l => 
        l.lesson_number === selectedLesson.lesson_number 
          ? { ...l, title: lessonTitle }
          : l
      ));
      
      // Start hiding animation after 3 seconds
      setTimeout(() => {
        setPopupHiding(true);
        // Actually remove after animation completes
        setTimeout(() => {
          setShowPopup(false);
          setPopupHiding(false);
        }, 300);
      }, 3000);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setMessage('Ошибка сохранения урока: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTest = async () => {
    if (!testData) return;

    setSaving(true);
    setMessage('');

    try {
      // Prepare questions in the format expected by backend
      const questions = testData.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        correct_answer: Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer].filter(Boolean),
        points: q.points || 1,
        explanation: q.explanation || '',
      }));

      await api.put(`/admin/modules/${moduleId}/test`, {
        questions: questions,
        settings: testData.settings,
      });

      setMessage('Тест успешно сохранен');
    } catch (error) {
      console.error('Error saving test:', error);
      setMessage('Ошибка сохранения теста: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!testData) return;

    const newQuestion = {
      id: `q${Date.now()}`,
      type: 'multiple_choice',
      question: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' },
      ],
      correct_answer: [],
      points: 1,
      explanation: '',
    };

    setTestData({
      ...testData,
      questions: [...testData.questions, newQuestion],
    });
  };

  const handleDeleteQuestion = (questionId) => {
    if (!testData) return;
    setTestData({
      ...testData,
      questions: testData.questions.filter(q => q.id !== questionId),
    });
  };

  const handleQuestionChange = (questionId, field, value) => {
    if (!testData) return;
    setTestData({
      ...testData,
      questions: testData.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
  };

  const handleOptionChange = (questionId, optionId, text) => {
    if (!testData) return;
    setTestData({
      ...testData,
      questions: testData.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map(opt =>
                opt.id === optionId ? { ...opt, text } : opt
              ),
            }
          : q
      ),
    });
  };

  if (loading) {
    return (
      <div>
        <div className="header">
          <div className="header-content">
            <h1>LMS MVP - Редактор</h1>
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
          <h1>LMS MVP - Редактор</h1>
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
        {message && !showPopup && (
          <div className={`card ${message.includes('Ошибка') ? 'error' : 'success'}`} style={{ marginBottom: '20px' }}>
            {message}
          </div>
        )}
        
        {showPopup && (
          <div className={`success-popup ${popupHiding ? 'hiding' : ''}`}>
            {popupMessage}
          </div>
        )}

        {modules.length > 1 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Выберите модуль для редактирования:
            </label>
            <select
              value={moduleId || ''}
              onChange={(e) => handleModuleChange(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentModule && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Редактирование модуля</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Название модуля:
              </label>
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Описание модуля:
              </label>
              <textarea
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSaveModule}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить модуль'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <button
            className={`btn ${activeTab === 'lessons' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('lessons')}
          >
            Уроки
          </button>
          <button
            className={`btn ${activeTab === 'test' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleTestSelect}
          >
            Тест
          </button>
        </div>

        {activeTab === 'lessons' && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: '0 0 300px' }}>
              <h3>Список уроков</h3>
              <ul className="lesson-list">
                {lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className={`lesson-item ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                    onClick={() => handleLessonSelect(lesson.lesson_number)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <span className="lesson-title">
                        Урок {lesson.lesson_number}: {lesson.title}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ flex: '1' }}>
              {selectedLesson ? (
                <div className="card">
                  <h3>Редактирование урока {selectedLesson.lesson_number}</h3>
                  
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '15px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>
                      Название урока:
                    </label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '16px',
                        border: '2px solid #4a90e2',
                        borderRadius: '4px',
                        fontWeight: '500',
                      }}
                      placeholder="Введите название урока"
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Содержимое (Markdown):
                    </label>
                    <textarea
                      ref={contentTextareaRef}
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '400px',
                        padding: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                    <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                      Подсказка: Для вставки видео в текст используйте кнопку "Вставить" рядом с загруженным видео
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <h4 style={{ marginBottom: '10px' }}>Видео файлы</h4>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Загрузить видео (MP4, WebM, MOV):
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        style={{ width: '100%', padding: '5px' }}
                      />
                      {uploadingVideo && <p style={{ marginTop: '5px', color: '#666' }}>Загрузка...</p>}
                    </div>

                    {lessonVideos.length > 0 && (
                      <div>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Загруженные видео:</p>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {lessonVideos.map((video, index) => (
                            <li key={index} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px',
                              marginBottom: '5px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              border: '1px solid #ddd'
                            }}>
                              <span style={{ flex: 1, marginRight: '10px' }}>{video}</span>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleInsertVideo(video)}
                                style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }}
                                title="Вставить видео в текущую позицию курсора"
                              >
                                Вставить
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleDeleteVideo(video)}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                Удалить
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleSaveLesson}
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить урок'}
                  </button>
                </div>
              ) : (
                <div className="card">
                  <p>Выберите урок для редактирования</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'test' && testData && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Редактирование теста</h3>
              <button className="btn btn-primary" onClick={handleAddQuestion}>
                Добавить вопрос
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Настройки теста</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Проходной балл (0-1):</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={testData.settings.passing_threshold || 0.7}
                    onChange={(e) =>
                      setTestData({
                        ...testData,
                        settings: {
                          ...testData.settings,
                          passing_threshold: parseFloat(e.target.value),
                        },
                      })
                    }
                    style={{ width: '100%', padding: '5px' }}
                  />
                </div>
                <div>
                  <label>Лимит времени (минуты):</label>
                  <input
                    type="number"
                    value={testData.settings.time_limit_minutes || 30}
                    onChange={(e) =>
                      setTestData({
                        ...testData,
                        settings: {
                          ...testData.settings,
                          time_limit_minutes: parseInt(e.target.value),
                        },
                      })
                    }
                    style={{ width: '100%', padding: '5px' }}
                  />
                </div>
                <div>
                  <label>Максимум попыток:</label>
                  <input
                    type="number"
                    value={testData.settings.max_attempts || 3}
                    onChange={(e) =>
                      setTestData({
                        ...testData,
                        settings: {
                          ...testData.settings,
                          max_attempts: parseInt(e.target.value),
                        },
                      })
                    }
                    style={{ width: '100%', padding: '5px' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4>Вопросы</h4>
              {testData.questions.map((question, index) => (
                <div key={question.id} className="card" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h5>Вопрос {index + 1}</h5>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      Удалить
                    </button>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>Тип вопроса:</label>
                    <select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(question.id, 'type', e.target.value)}
                      style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="multiple_choice">Множественный выбор</option>
                      <option value="text">Текстовый ответ</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>Текст вопроса:</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                      style={{ width: '100%', minHeight: '60px', padding: '5px' }}
                    />
                  </div>

                  {question.type === 'multiple_choice' && (
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        <label>Варианты ответов:</label>
                        {question.options.map((option) => (
                          <div key={option.id} style={{ marginBottom: '5px' }}>
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => handleOptionChange(question.id, option.id, e.target.value)}
                              placeholder={`Вариант ${option.id.toUpperCase()}`}
                              style={{ width: '100%', padding: '5px' }}
                            />
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label>Правильные ответы (через запятую, например: a,b или просто a):</label>
                        <input
                          type="text"
                          value={Array.isArray(question.correct_answer) ? question.correct_answer.join(',') : (question.correct_answer || '')}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            if (!value) {
                              handleQuestionChange(question.id, 'correct_answer', []);
                            } else {
                              const answers = value.split(',').map(a => a.trim()).filter(a => a);
                              handleQuestionChange(question.id, 'correct_answer', answers.length === 1 ? answers[0] : answers);
                            }
                          }}
                          style={{ width: '100%', padding: '5px' }}
                        />
                      </div>
                    </>
                  )}

                  {question.type === 'text' && (
                    <div style={{ marginBottom: '10px' }}>
                      <label>Правильный ответ:</label>
                      <input
                        type="text"
                        value={question.correct_answer || ''}
                        onChange={(e) => handleQuestionChange(question.id, 'correct_answer', e.target.value)}
                        style={{ width: '100%', padding: '5px' }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '10px' }}>
                    <label>Баллы:</label>
                    <input
                      type="number"
                      value={question.points || 1}
                      onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value))}
                      style={{ width: '100px', padding: '5px' }}
                    />
                  </div>

                  <div>
                    <label>Объяснение:</label>
                    <textarea
                      value={question.explanation || ''}
                      onChange={(e) => handleQuestionChange(question.id, 'explanation', e.target.value)}
                      style={{ width: '100%', minHeight: '40px', padding: '5px' }}
                    />
                  </div>
                </div>
              ))}

              {testData.questions.length === 0 && (
                <p>Нет вопросов. Нажмите "Добавить вопрос" для создания.</p>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSaveTest}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить тест'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminEditor;

