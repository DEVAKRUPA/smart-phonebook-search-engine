import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-status">Loading...</div>;
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth/login/" element={<Navigate to="/login" replace />} />
      <Route path="/auth/register/" element={<Navigate to="/register" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard theme={theme} setTheme={setTheme} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
