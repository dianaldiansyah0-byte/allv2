import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const { authHeader } = useAuth();

  const createOrder = async (payload) => {
    const res = await axios.post(`${API}/orders`, payload, { headers: { ...authHeader() } });
    return res.data;
  };

  const payOrder = async (orderKey) => {
    const res = await axios.post(`${API}/orders/${orderKey}/pay`, {}, { headers: { ...authHeader() } });
    return res.data;
  };

  const getOrder = async (key) => {
    try {
      const res = await axios.get(`${API}/orders/${key}`);
      return res.data;
    } catch (e) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  };

  const myOrders = async () => {
    if (!authHeader().Authorization) return [];
    const res = await axios.get(`${API}/orders`, { headers: { ...authHeader() } });
    return res.data;
  };

  const validateVoucher = async (code, amount) => {
    const res = await axios.post(`${API}/vouchers/validate`, { code, amount });
    return res.data;
  };

  return (
    <StoreContext.Provider value={{ createOrder, payOrder, getOrder, myOrders, validateVoucher }}>
      {children}
    </StoreContext.Provider>
  );
};
