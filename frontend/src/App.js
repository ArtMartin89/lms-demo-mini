import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModuleView from './pages/ModuleView';
import LessonView from './pages/LessonView';
import TestView from './pages/TestView';
import TestResults from './pages/TestResults';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="container">Загрузка...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/modules/:moduleId"
              element={
                <PrivateRoute>
                  <ModuleView />
                </PrivateRoute>
              }
            />
            <Route
              path="/modules/:moduleId/lessons/:lessonNumber"
              element={
                <PrivateRoute>
                  <LessonView />
                </PrivateRoute>
              }
            />
            <Route
              path="/modules/:moduleId/test"
              element={
                <PrivateRoute>
                  <TestView />
                </PrivateRoute>
              }
            />
            <Route
              path="/modules/:moduleId/test/results"
              element={
                <PrivateRoute>
                  <TestResults />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

