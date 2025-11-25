import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import ReactPlayer from 'react-player';
import '../App.css';

// Custom component for rendering video in markdown
const VideoRenderer = ({ moduleId, lessonNumber, filename }) => {
  const getVideoUrl = (filename) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
    const videoUrl = `${baseUrl}/modules/${moduleId}/lessons/${lessonNumber}/video/${filename}`;
    const token = localStorage.getItem('token');
    if (token) {
      return `${videoUrl}?token=${encodeURIComponent(token)}`;
    }
    return videoUrl;
  };

  const videoUrl = getVideoUrl(filename);
  
  return (
    <div style={{ marginBottom: '30px', marginTop: '30px' }}>
      <div style={{
        position: 'relative',
        paddingTop: '56.25%', // 16:9 aspect ratio
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#000',
        maxWidth: '800px'
      }}>
        <ReactPlayer
          url={videoUrl}
          controls
          playing={false}
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
                crossOrigin: 'anonymous'
              },
              forceVideo: true,
              hlsOptions: {
                enableWorker: true
              }
            }
          }}
          onError={(error) => {
            console.error('Video playback error:', error);
          }}
        />
      </div>
    </div>
  );
};

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
      const lessonRes = await api.get(`/modules/${moduleId}/lessons/${lessonNumber}`);
      setLesson(lessonRes.data.lesson);
      setContent(lessonRes.data.content);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse content and replace [VIDEO:filename] with video components
  const parseContentWithVideos = (content) => {
    // Replace [VIDEO:filename] with a special markdown image syntax that we'll handle
    return content.replace(/\[VIDEO:([^\]]+)\]/g, (match, filename) => {
      return `![VIDEO](${filename})`;
    });
  };

  // Custom components for react-markdown
  const markdownComponents = {
    img: ({ node, ...props }) => {
      // Check if this is a video placeholder
      if (props.alt === 'VIDEO') {
        return <VideoRenderer moduleId={moduleId} lessonNumber={lessonNumber} filename={props.src} />;
      }
      // Regular image
      return <img {...props} />;
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
            <ReactMarkdown components={markdownComponents}>
              {parseContentWithVideos(content)}
            </ReactMarkdown>
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

