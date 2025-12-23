import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Technicians from './components/Technicians';
import WorkOrders from './components/WorkOrders';
import Materials from './components/Materials';
import Clients from './components/Clients';
import Schedule from './components/Schedule';
import Users from './components/Users';
import Backup from './components/Backup';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const pingBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        setBackendStatus(res.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    pingBackend();
    const interval = setInterval(pingBackend, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('dashboard');
  };

  if (!token) {
    return <Login onLogin={handleLogin} apiUrl={API_URL} backendStatus={backendStatus} />;
  }

  const menuItems = [
    { view: 'dashboard', label: 'Dashboard', icon: '📊' },
    { view: 'work-orders', label: 'Órdenes', icon: '📋' },
    { view: 'schedule', label: 'Agenda', icon: '📅' },
    { view: 'technicians', label: 'Técnicos', icon: '👷' },
    { view: 'clients', label: 'Clientes', icon: '👥' },
    { view: 'materials', label: 'Materiales', icon: '📦' },
    { view: 'users', label: 'Usuarios', icon: '👤' },
    { view: 'backup', label: 'Respaldo', icon: '💾' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Ártico" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
              <div>
                <h1 className="text-lg font-bold">Sistema Ártico</h1>
                <p className="text-xs text-red-100">Servicios Técnicos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-red-100">{user?.role === 'admin' ? 'Admin' : 'Técnico'}</p>
              </div>
              <button onClick={handleLogout} className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium">
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden md:block w-64 bg-white shadow-lg min-h-screen">
          <nav className="py-4">
            {menuItems.map(item => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full text-left px-6 py-3 flex items-center gap-3 transition ${
                  currentView === item.view 
                    ? 'bg-red-50 border-l-4 border-red-600 text-red-600 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Menu */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t z-40">
          <div className="grid grid-cols-6 gap-1 py-2">
            {menuItems.map(item => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex flex-col items-center px-2 py-2 ${
                  currentView === item.view ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-7xl">
          {currentView === 'dashboard' && <Dashboard token={token} apiUrl={API_URL} />}
          {currentView === 'work-orders' && <WorkOrders token={token} apiUrl={API_URL} />}
          {currentView === 'schedule' && <Schedule token={token} apiUrl={API_URL} />}
          {currentView === 'technicians' && <Technicians token={token} apiUrl={API_URL} />}
          {currentView === 'clients' && <Clients token={token} apiUrl={API_URL} />}
          {currentView === 'materials' && <Materials token={token} apiUrl={API_URL} />}
          {currentView === 'users' && <Users token={token} apiUrl={API_URL} />}
          {currentView === 'backup' && <Backup token={token} apiUrl={API_URL} />}
        </main>
      </div>
    </div>
  );
}

export default App;