import React, { useState } from 'react';

export default function Login({ onLogin, apiUrl, backendStatus }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('El servidor está iniciando. Espera 30 segundos e intenta de nuevo.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Ártico" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistema Ártico</h1>
          <p className="text-sm text-gray-600">Servicios Técnicos Profesionales</p>
        </div>

        {/* Backend Status */}
        {backendStatus === 'offline' && (
          <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-700 px-4 py-3 rounded mb-4 text-sm">
            <p className="font-medium">⏳ Servidor iniciando...</p>
            <p className="text-xs mt-1">Esto toma ~30 segundos en el primer acceso.</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="admin"
              required
              disabled={loading || backendStatus === 'offline'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={loading || backendStatus === 'offline'}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || backendStatus === 'offline'}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Credentials */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600 mb-2">Credenciales por defecto:</p>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Usuario:</span> admin</p>
            <p><span className="font-semibold">Contraseña:</span> admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}