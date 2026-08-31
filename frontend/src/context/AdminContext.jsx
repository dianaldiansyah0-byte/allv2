import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('av2_admin_token'));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const hdr = useCallback((t) => ({ headers: { Authorization: `Bearer ${t || token}` } }), [token]);

  useEffect(() => {
    const boot = async () => {
      const t = localStorage.getItem('av2_admin_token');
      if (!t) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
        if (res.data.role === 'admin') setAdmin(res.data);
        else { localStorage.removeItem('av2_admin_token'); setToken(null); }
      } catch (e) { localStorage.removeItem('av2_admin_token'); setToken(null); }
      finally { setLoading(false); }
    };
    boot();
  }, []);

  const err = (e, f) => new Error(e?.response?.data?.detail || f);

  const setupStatus = async () => (await axios.get(`${API}/admin/setup-status`)).data;

  const setup = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/admin/setup`, { name, email, password });
      localStorage.setItem('av2_admin_token', res.data.token); setToken(res.data.token); setAdmin(res.data.user);
      return res.data.user;
    } catch (e) { throw err(e, 'Gagal membuat admin.'); }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/admin/login`, { email, password });
      localStorage.setItem('av2_admin_token', res.data.token); setToken(res.data.token); setAdmin(res.data.user);
      return res.data.user;
    } catch (e) { throw err(e, 'Gagal login.'); }
  };

  const logout = () => { localStorage.removeItem('av2_admin_token'); setToken(null); setAdmin(null); };

  // generic API
  const get = async (path) => (await axios.get(`${API}${path}`, hdr())).data;
  const post = async (path, body) => (await axios.post(`${API}${path}`, body, hdr())).data;
  const put = async (path, body) => (await axios.put(`${API}${path}`, body, hdr())).data;
  const del = async (path) => (await axios.delete(`${API}${path}`, hdr())).data;

  const value = {
    token, admin, loading, setupStatus, setup, login, logout,
    stats: () => get('/admin/stats'),
    // games
    listGames: () => get('/admin/games'),
    createGame: (b) => post('/admin/games', b),
    updateGame: (slug, b) => put(`/admin/games/${slug}`, b),
    deleteGame: (slug) => del(`/admin/games/${slug}`),
    // vouchers
    listVouchers: () => get('/admin/vouchers'),
    createVoucher: (b) => post('/admin/vouchers', b),
    updateVoucher: (code, b) => put(`/admin/vouchers/${code}`, b),
    deleteVoucher: (code) => del(`/admin/vouchers/${code}`),
    // content collections (banners, flashsale, specialoffers, ...)
    listContent: (c) => get(`/admin/content/${c}`),
    createContent: (c, b) => post(`/admin/content/${c}`, b),
    updateContent: (c, id, b) => put(`/admin/content/${c}/${id}`, b),
    deleteContent: (c, id) => del(`/admin/content/${c}/${id}`),
    // payments
    listPayments: () => get('/admin/payments'),
    createPayment: (b) => post('/admin/payments', b),
    updatePayment: (id, b) => put(`/admin/payments/${id}`, b),
    deletePayment: (id) => del(`/admin/payments/${id}`),
    // users / orders / settings
    listUsers: () => get('/admin/users'),
    listOrders: () => get('/admin/orders'),
    updateOrder: (id, status) => put(`/admin/orders/${id}`, { status }),
    getSettings: () => get('/admin/settings'),
    updateSettings: (b) => put('/admin/settings', b),
    logs: () => get('/admin/logs'),
    // media library
    listMedia: () => get('/admin/media'),
    uploadMedia: (b) => post('/admin/media', b),
    deleteMedia: (id) => del(`/admin/media/${id}`),
    // midtrans
    getMidtrans: () => get('/admin/integrations/midtrans'),
    saveMidtrans: (b) => put('/admin/integrations/midtrans', b),
    testMidtrans: () => post('/admin/integrations/midtrans/test', {}),
    listMidtransTx: () => get('/admin/midtrans/transactions'),
    refreshMidtransTx: (orderId) => post(`/admin/midtrans/transactions/${orderId}/refresh`, {}),
    // digiflazz
    getDigiflazz: () => get('/admin/integrations/digiflazz'),
    saveDigiflazz: (b) => put('/admin/integrations/digiflazz', b),
    dgfStatus: () => get('/admin/digiflazz/status'),
    dgfBalance: () => get('/admin/digiflazz/balance'),
    dgfSync: () => post('/admin/digiflazz/sync-prices', {}),
    dgfProducts: () => get('/admin/digiflazz/products'),
    dgfAutomap: () => post('/admin/digiflazz/automap', {}),
    dgfRetryPending: () => post('/admin/digiflazz/retry-pending', {}),
    fulfillOrder: (id) => post(`/admin/orders/${id}/fulfill`, {}),
    changeCreds: async (b) => {
      const res = await axios.post(`${API}/admin/change-credentials`, b, hdr());
      localStorage.setItem('av2_admin_token', res.data.token);
      setToken(res.data.token); setAdmin(res.data.user);
      return res.data.user;
    },
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
