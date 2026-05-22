import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

function getResponseUser(data) {
  return data?.user || data || null;
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data && typeof data === 'object') {
    return Object.values(data).flat().join(' ');
  }

  return 'Something went wrong. Please try again.';
}

function clearCachedUserState() {
  ['user', 'authUser', 'currentUser'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkUser = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/auth/user/');
      const currentUser = getResponseUser(response.data);
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      clearCachedUserState();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setError('');

    try {
      const response = await api.post('/auth/login/', { username, password });
      const loggedInUser = getResponseUser(response.data);
      setUser(loggedInUser);
      return response.data;
    } catch (loginError) {
      const message = getErrorMessage(loginError);
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (username, email, password) => {
    setError('');

    try {
      const response = await api.post('/auth/register/', {
        username,
        email,
        password,
      });
      return response.data;
    } catch (registerError) {
      const message = getErrorMessage(registerError);
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    setError('');

    try {
      await api.post('/auth/logout/');
    } catch (logoutError) {
      setError(getErrorMessage(logoutError));
    } finally {
      setUser(null);
      setError('');
      clearCachedUserState();
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, checkUser, login, register, logout }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
