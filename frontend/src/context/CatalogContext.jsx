import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as mock from '../mock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);

const groupPayments = (flat) => {
  const order = [];
  const map = {};
  (flat || []).forEach((p) => {
    if (!map[p.group]) { map[p.group] = { group: p.group, items: [] }; order.push(p.group); }
    map[p.group].items.push(p);
  });
  return order.map((g) => map[g]);
};

// Fallback grouped payments from mock
const MOCK_PAYMENTS = mock.PAYMENT_METHODS;

export const CatalogProvider = ({ children }) => {
  const [games, setGames] = useState(mock.GAMES);
  const [banners, setBanners] = useState(mock.HERO_BANNERS);
  const [flashSale, setFlashSale] = useState(mock.FLASH_SALE);
  const [specialOffers, setSpecialOffers] = useState(mock.SPECIAL_OFFERS);
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [vouchers, setVouchers] = useState(mock.VOUCHERS);
  const [settings, setSettings] = useState(mock.SETTINGS || null);
  const [sellAccounts, setSellAccounts] = useState(mock.SELL_ACCOUNTS);
  const [itemSkins, setItemSkins] = useState(mock.ITEM_SKINS);
  const [pulsa, setPulsa] = useState({ operators: mock.PULSA_OPERATORS, nominals: mock.PULSA_NOMINALS, tagihan: mock.TAGIHAN });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [g, b, f, s, p, v, st, sa, isk, pl] = await Promise.all([
        axios.get(`${API}/catalog/games`),
        axios.get(`${API}/catalog/banners`),
        axios.get(`${API}/catalog/flashsale`),
        axios.get(`${API}/catalog/specialoffers`),
        axios.get(`${API}/catalog/payments`),
        axios.get(`${API}/catalog/vouchers`),
        axios.get(`${API}/catalog/settings`),
        axios.get(`${API}/catalog/sellaccounts`),
        axios.get(`${API}/catalog/itemskins`),
        axios.get(`${API}/catalog/pulsa`),
      ]);
      if (g.data?.length) setGames(g.data);
      if (b.data?.length) setBanners(b.data);
      setFlashSale(f.data || []);
      setSpecialOffers(s.data || []);
      if (p.data?.length) setPayments(groupPayments(p.data));
      setVouchers(v.data || []);
      if (st.data) setSettings(st.data);
      setSellAccounts(sa.data || []);
      setItemSkins(isk.data || []);
      if (pl.data) setPulsa({ operators: pl.data.operators || [], nominals: pl.data.nominals || [], tagihan: pl.data.tagihan || [] });
    } catch (e) {
      console.error('Catalog load failed, using cached/mock fallback:', e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getGame = useCallback((slug) => games.find((x) => x.slug === slug), [games]);
  const getVoucher = useCallback((code) => vouchers.find((x) => x.code?.toLowerCase() === (code || '').toLowerCase()), [vouchers]);
  const flatPayments = useCallback(() => payments.flatMap((g) => g.items), [payments]);

  return (
    <CatalogContext.Provider value={{ games, banners, flashSale, specialOffers, payments, vouchers, settings, sellAccounts, itemSkins, pulsa, loading, getGame, getVoucher, flatPayments, reload: load }}>
      {children}
    </CatalogContext.Provider>
  );
};
