import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CatalogProvider } from './context/CatalogContext';
import { AdminProvider } from './context/AdminContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LiveToast from './components/LiveToast';
import OrderWatcher from './components/OrderWatcher';
import SiteBranding from './components/SiteBranding';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import GameDetailPage from './pages/GameDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import TransactionsPage from './pages/TransactionsPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { JualAkunPage, ItemSkinPage, VoucherPage, PulsaPage } from './pages/CategoryPages';
import { PaymentSuccessPage, PaymentCancelPage } from './pages/PaymentResultPages';
import AdminApp from './admin/AdminApp';

function PublicSite() {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:slug" element={<GameDetailPage />} />
          <Route path="/pembayaran/:invoice" element={<CheckoutPage />} />
          <Route path="/transaksi" element={<TransactionsPage />} />
          <Route path="/masuk" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/jual-akun" element={<JualAkunPage />} />
          <Route path="/item-skin" element={<ItemSkinPage />} />
          <Route path="/voucher" element={<VoucherPage />} />
          <Route path="/pulsa" element={<PulsaPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/finish" element={<PaymentSuccessPage />} />
          <Route path="/payment/pending" element={<PaymentSuccessPage />} />
          <Route path="/payment/error" element={<PaymentCancelPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        </Routes>
      </main>
      <Footer />
      <LiveToast />
      <OrderWatcher />
      <SiteBranding />
    </>
  );
}

function Shell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/own');
  if (isAdmin) {
    return (
      <AdminProvider>
        <Routes>
          <Route path="/own/*" element={<AdminApp />} />
        </Routes>
      </AdminProvider>
    );
  }
  return <PublicSite />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CatalogProvider>
          <StoreProvider>
            <BrowserRouter>
              <Shell />
              <Toaster />
            </BrowserRouter>
          </StoreProvider>
        </CatalogProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
