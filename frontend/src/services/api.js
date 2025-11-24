import axios from 'axios';

// Get API URL from environment or use default
// В dev режиме React переменные окружения должны быть доступны
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Принудительно устанавливаем правильный URL, если он не установлен
const finalApiUrl = API_URL.endsWith('/api/v1') ? API_URL : 'http://localhost:8000/api/v1';

console.log('API Base URL:', finalApiUrl); // Debug log

const api = axios.create({
  baseURL: finalApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;

