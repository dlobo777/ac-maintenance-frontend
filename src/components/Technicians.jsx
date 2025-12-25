import React, { useState, useEffect } from 'react';

export default function Technicians({ token, apiUrl }) {
  const [technicians, setTechnicians] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    status: 'active'
  });

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/technicians`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTechnicians(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${apiUrl}/api/technicians/${editingId}`
        : `${apiUrl}/api/technicians`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('✅ Técnico guardado exitosamente');
        fetchTechnicians();
        resetForm();
      } else {
        const error = await res.json();
        alert('❌ Error: ' + (error.error || 'No se pudo guardar el técnico'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar: ' + err.message);
    }
  };

  const handleEdit = (tech) => {
    setFormData(tech);
    setEditingId(tech.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    // Verificar si tiene órdenes o bodegas asignadas
    const tech = technicians.find(t => t.id === id);
    
    if (!confirm(`¿Eliminar el técnico "${tech.name}"?\n\nNOTA: Si tiene órdenes de trabajo o bodegas asignadas, no podrá eliminarse. En ese caso, puedes marcarlo como "Inactivo".`)) {
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/api/technicians/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('✅ Técnico eliminado exitosamente');
        fetchTechnicians();
      } else {
        const error = await res.json();
        
        // Mensaje más específico según el error
        if (error.error?.includes('foreign key') || error.error?.includes('constraint')) {
          alert(`❌ No se puede eliminar este técnico porque tiene:\n\n- Órdenes de trabajo asignadas, O\n- Una bodega asignada\n\nSolución: Marca el técnico como "Inactivo" en lugar de eliminarlo.`);
        } else {
          alert('❌ Error: ' + (error.error || 'No se pudo eliminar el técnico'));
        }
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', specialization: '', status: 'active' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Técnicos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Técnico'}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>Consejo:</strong> Si un técnico ya no trabaja contigo pero tiene órdenes históricas o bodegas asignadas, 
          márcalo como <strong>"Inactivo"</strong> en lugar de eliminarlo. Así mantienes el historial completo.
        </p>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Técnico' : 'Nuevo Técnico'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+506-8888-1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="tecnico@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Especialización</label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>
            {editingId && (
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
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
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Teléfono</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Especialización</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">No hay técnicos</td>
                </tr>
              ) : (
                technicians.map(tech => (
                  <tr key={tech.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{tech.id}</td>
                    <td className="py-3 px-4 font-medium">{tech.name}</td>
                    <td className="py-3 px-4">{tech.phone || 'N/A'}</td>
                    <td className="py-3 px-4">{tech.email || 'N/A'}</td>
                    <td className="py-3 px-4">{tech.specialization || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        tech.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tech.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(tech)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tech.id)}
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