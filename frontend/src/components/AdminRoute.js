import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.is_superuser) {
    return (
      <div className="container">
        <div className="card">
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав администратора для доступа к этой странице.</p>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminRoute;

