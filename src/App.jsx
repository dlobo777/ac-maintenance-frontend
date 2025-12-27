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
import Warehouses from './components/Warehouses';
import Reports from './components/Reports';

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

  // Protección contra cierre accidental o navegación hacia atrás
  useEffect(() => {
    // Solo activar si el usuario está logueado
    if (!token) return;

    // Advertencia al cerrar pestaña/navegador o recargar página
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requiere esto
      return ''; // Para compatibilidad con navegadores antiguos
    };

    // Advertencia al usar botón "atrás" del navegador
    const handlePopState = (e) => {
      const confirmLeave = window.confirm(
        '⚠️ ¿Deseas salir de la aplicación?\n\nTodos los datos no guardados se perderán.\n\nPresiona "Cancelar" para quedarte o "Aceptar" para salir.'
      );
      
      if (!confirmLeave) {
        // Si cancela, volver a poner la página en el estado actual
        window.history.pushState(null, '', window.location.href);
      } else {
        // Si confirma, hacer logout y permitir navegación
        handleLogout();
      }
    };

    // Agregar entrada inicial al historial para capturar el botón "atrás"
    window.history.pushState(null, '', window.location.href);

    // Agregar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup al desmontar
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [token]); // Se ejecuta cuando cambia el token (login/logout)

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

  // Menu items basado en rol
  const allMenuItems = [
    { view: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'tecnico'] },
    { view: 'work-orders', label: 'Órdenes', icon: '📋', roles: ['admin', 'tecnico'] },
    { view: 'schedule', label: 'Agenda', icon: '📅', roles: ['admin', 'tecnico'] },
    { view: 'technicians', label: 'Técnicos', icon: '👷', roles: ['admin'] },
    { view: 'clients', label: 'Clientes', icon: '👥', roles: ['admin', 'tecnico'] },
    { view: 'materials', label: 'Materiales', icon: '📦', roles: ['admin', 'tecnico'] },
    { view: 'warehouses', label: 'Bodegas', icon: '🏪', roles: ['admin', 'tecnico'] },
    { view: 'reports', label: 'Reportes', icon: '📈', roles: ['admin'] },
    { view: 'users', label: 'Usuarios', icon: '👤', roles: ['admin'] },
    { view: 'backup', label: 'Respaldo', icon: '💾', roles: ['admin'] }
  ];
  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t z-40">
          <div className="grid gap-1 py-2" style={{gridTemplateColumns: `repeat(${menuItems.length}, 1fr)`}}>
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

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-7xl">
          {currentView === 'dashboard' && <Dashboard token={token} apiUrl={API_URL} setCurrentView={setCurrentView} />}
          {currentView === 'work-orders' && <WorkOrders token={token} apiUrl={API_URL} />}
          {currentView === 'schedule' && <Schedule token={token} apiUrl={API_URL} setCurrentView={setCurrentView} />}
          {currentView === 'technicians' && user?.role === 'admin' && <Technicians token={token} apiUrl={API_URL} />}
          {currentView === 'clients' && <Clients token={token} apiUrl={API_URL} />}
          {currentView === 'materials' && <Materials token={token} apiUrl={API_URL} />}
          {currentView === 'warehouses' && <Warehouses token={token} apiUrl={API_URL} />}
          {currentView === 'reports' && user?.role === 'admin' && <Reports token={token} apiUrl={API_URL} />}
          {currentView === 'users' && user?.role === 'admin' && <Users token={token} apiUrl={API_URL} />}
          {currentView === 'backup' && user?.role === 'admin' && <Backup token={token} apiUrl={API_URL} />}
        </main>
      </div>
    </div>
  );
}

export default App;