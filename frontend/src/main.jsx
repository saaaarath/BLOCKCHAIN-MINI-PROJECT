import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Upload from './pages/Upload';
import Access from './pages/Access';
import Directory from './pages/Directory';
import Settings from './pages/Settings';
import Blockchain from './pages/Blockchain';

function App() {
  return <AuthProvider><ToastProvider><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}><Route path="/app" element={<Layout />}><Route index element={<Dashboard />} /><Route path="records" element={<Records />} /><Route path="upload" element={<ProtectedRoute role="PATIENT" />}><Route index element={<Upload />} /></Route><Route path="directory" element={<Directory />} /><Route path="access" element={<Access />} /><Route path="blockchain" element={<Blockchain />} /><Route path="settings" element={<Settings />} /></Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></ToastProvider></AuthProvider>;
}

createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
