import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DealerDashboard from './pages/DealerDashboard.jsx';
import PaymentCallback from './pages/PaymentCallback.jsx';
import RenewalCallback from './pages/RenewalCallback.jsx';
import PartnerApplication from './pages/PartnerApplication.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import FactoryDashboard from './pages/FactoryDashboard.jsx';

export default function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />
         <Route path="/renewal-callback" element={<RenewalCallback />} />

        {/* BAŞVURU FORMLARI */}
        <Route path="/partner-application" element={<PartnerApplication />} />

        {/* KORUMALI DASHBOARD - Token yoksa login'e yönlendir */}
        <Route
          path="/dashboard/:uuid"
          element={
            token ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />
        <Route 
          path="/dealer/dashboard/:uuid" 
          element={<DealerDashboard />} 
        />
        <Route 
          path="/admin/dashboard/:uuid" 
          element={<AdminDashboard />} 
        />
        <Route 
          path="/factory/dashboard/:uuid" 
          element={<FactoryDashboard />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}