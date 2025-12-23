import React, { useState, useEffect } from 'react';

export default function Users({ token, apiUrl }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'tecnico'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${apiUrl}/api/users/${editingId}`
        : `${apiUrl}/api/users`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchUsers();
        resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    
    try {
      await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'tecnico' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Usuario *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                required
                disabled={editingId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña {editingId ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                required={!editingId}
                placeholder={editingId ? 'Nueva contraseña' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rol *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Usuario</th>
                <th className="text-left py-3 px-4">Rol</th>
                <th className="text-left py-3 px-4">Fecha Creación</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">No hay usuarios</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{user.id}</td>
                    <td className="py-3 px-4 font-medium">{user.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Técnico'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}