import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('av2_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const t = localStorage.getItem('av2_token');
      if (!t) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
        setUser(res.data);
      } catch (e) {
        localStorage.removeItem('av2_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const parseErr = (e, fallback) => e?.response?.data?.detail || fallback;

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('av2_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (e) { throw new Error(parseErr(e, 'Gagal masuk.')); }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/auth/register`, { name, email, password });
      localStorage.setItem('av2_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (e) { throw new Error(parseErr(e, 'Gagal mendaftar.')); }
  };

  const logout = () => {
    localStorage.removeItem('av2_token');
    setToken(null);
    setUser(null);
  };

  const authHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
};
