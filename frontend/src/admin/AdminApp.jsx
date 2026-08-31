import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import AdminAuth from './AdminAuth';
import AdminLayout from './AdminLayout';
import Dashboard from './pages/Dashboard';
import GamesAdmin from './pages/GamesAdmin';
import OrdersAdmin from './pages/OrdersAdmin';
import VouchersAdmin from './pages/VouchersAdmin';
import PromotionsAdmin from './pages/PromotionsAdmin';
import PaymentsAdmin from './pages/PaymentsAdmin';
import UsersAdmin from './pages/UsersAdmin';
import SettingsAdmin from './pages/SettingsAdmin';
import ContentAdmin from './pages/ContentAdmin';
import ActivityLog from './pages/ActivityLog';
import DigiflazzAdmin from './pages/DigiflazzAdmin';
import MidtransAdmin from './pages/MidtransAdmin';
import MediaAdmin from './pages/MediaAdmin';
import { Loader2 } from 'lucide-react';

const AdminApp = () => {
  const { admin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!admin) return <AdminAuth />;

  return (
    <AdminLayout>
      <Routes>
        <Route path="" element={<Dashboard />} />
        <Route path="games" element={<GamesAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="vouchers" element={<VouchersAdmin />} />
        <Route path="promotions" element={<PromotionsAdmin />} />
        <Route path="content" element={<ContentAdmin />} />
        <Route path="media" element={<MediaAdmin />} />
        <Route path="midtrans" element={<MidtransAdmin />} />
        <Route path="digiflazz" element={<DigiflazzAdmin />} />
        <Route path="payments" element={<PaymentsAdmin />} />
        <Route path="users" element={<UsersAdmin />} />
        <Route path="logs" element={<ActivityLog />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;
