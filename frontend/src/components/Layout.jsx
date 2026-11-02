import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Bell, BookOpen, ChevronLeft, FilePlus2, FileText, LayoutDashboard, LogOut, Menu, Network, Settings, ShieldCheck, Stethoscope, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { shortenAddress } from '../lib/wallet';
import { Button } from './ui';

const patientLinks = [
  ['/app', 'Overview', LayoutDashboard], ['/app/records', 'My records', FileText], ['/app/upload', 'Upload record', FilePlus2], ['/app/directory', 'Doctors', Stethoscope], ['/app/access', 'Access requests', ShieldCheck], ['/app/blockchain', 'Blockchain history', Network], ['/app/settings', 'Settings', Settings]
];
const doctorLinks = [
  ['/app', 'Overview', LayoutDashboard], ['/app/records', 'Authorized records', FileText], ['/app/directory', 'Patients', Users], ['/app/access', 'Access requests', ShieldCheck], ['/app/blockchain', 'Blockchain history', Network], ['/app/settings', 'Settings', Settings]
];

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const links = user?.role === 'DOCTOR' ? doctorLinks : patientLinks;
  const signOut = async () => { await logout(); navigate('/login'); };
  return <div className="app-shell">
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark"><Activity size={19} /></div><span>CareLedger</span><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="sidebar-nav">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/app'} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer"><div className="security-note"><ShieldCheck size={16} /><span>Patient-controlled<br />security</span></div><button className="nav-item" onClick={signOut}><LogOut size={18} /><span>Sign out</span></button></div>
    </aside>
    {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="main-shell">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><button className="collapse-button" onClick={() => setCollapsed(!collapsed)}><ChevronLeft size={18} className={collapsed ? 'rotate-180' : ''} /></button><div className="topbar-spacer" /><button className="icon-button"><Bell size={18} /></button><div className="topbar-user"><div className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</div><div className="topbar-user-info"><strong>{user?.name}</strong><span>{shortenAddress(user?.walletAddress)}</span></div></div></header>
      <main className="content"><Outlet /></main>
    </div>
  </div>;
}
