import React, { useState } from 'react';

export default function Backup({ token, apiUrl }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDownloadBackup = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${apiUrl}/api/backup/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al generar el respaldo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-artico-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage('✅ Respaldo descargado exitosamente');
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('⚠️ ADVERTENCIA: Esto sobrescribirá todos los datos actuales. ¿Continuar?')) {
      e.target.value = '';
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch(`${apiUrl}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error al restaurar el respaldo');
      }

      setMessage('✅ Respaldo restaurado exitosamente. Recarga la página.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Respaldo de Base de Datos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Download Backup */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">💾</div>
            <h3 className="text-xl font-bold text-gray-800">Descargar Respaldo</h3>
            <p className="text-sm text-gray-600 mt-2">
              Descarga una copia completa de todos los datos del sistema
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Descargar Respaldo'}
          </button>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📋 Incluye:</strong>
              <ul className="mt-2 ml-4 list-disc text-xs">
                <li>Técnicos</li>
                <li>Clientes</li>
                <li>Órdenes de trabajo</li>
                <li>Materiales</li>
                <li>Usuarios (sin contraseñas)</li>
              </ul>
            </p>
          </div>
        </div>

        {/* Restore Backup */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-800">Restaurar Respaldo</h3>
            <p className="text-sm text-gray-600 mt-2">
              Carga un respaldo previo para restaurar los datos
            </p>
          </div>

          <label className="block w-full">
            <span className="sr-only">Seleccionar archivo</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer disabled:opacity-50"
            />
          </label>

          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <strong>⚠️ ADVERTENCIA:</strong>
              <ul className="mt-2 ml-4 list-disc text-xs">
                <li>Esto eliminará todos los datos actuales</li>
                <li>Los reemplazará con el respaldo</li>
                <li>Esta acción no se puede deshacer</li>
                <li>Asegúrate de tener un respaldo reciente</li>
              </ul>
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-6 p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-center font-medium">{message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h4 className="font-bold text-gray-800 mb-3">📖 Instrucciones</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Para hacer respaldo:</strong></p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>Click en "Descargar Respaldo"</li>
            <li>El archivo se descargará automáticamente</li>
            <li>Guárdalo en un lugar seguro</li>
          </ol>

          <p className="mt-4"><strong>Para restaurar:</strong></p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>Click en "Seleccionar archivo"</li>
            <li>Selecciona el archivo de respaldo (.json)</li>
            <li>Confirma la acción</li>
            <li>Espera a que se complete la restauración</li>
          </ol>

          <p className="mt-4 text-xs text-gray-600">
            <strong>💡 Consejo:</strong> Haz respaldos regularmente, especialmente antes de hacer cambios importantes.
          </p>
        </div>
      </div>
    </div>
  );
}