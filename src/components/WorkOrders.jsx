import React, { useState, useEffect } from 'react';

export default function WorkOrders({ token, apiUrl, editOrderId }) {
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    technician_id: '',
    status: 'pending',
    priority: 'normal',
    scheduled_date: '',
    scheduled_time: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchClients();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (editOrderId) {
      const order = orders.find(o => o.id === editOrderId);
      if (order) {
        handleEdit(order);
      }
    }
  }, [editOrderId, orders]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/work-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/technicians`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTechnicians(data.filter(t => t.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${apiUrl}/api/work-orders/${editingId}`
        : `${apiUrl}/api/work-orders`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchOrders();
        resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (order) => {
    setFormData({
      title: order.title,
      description: order.description || '',
      client_id: order.client_id || '',
      technician_id: order.technician_id || '',
      status: order.status,
      priority: order.priority,
      scheduled_date: order.scheduled_date?.split('T')[0] || '',
      scheduled_time: order.scheduled_time || ''
    });
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    
    try {
      await fetch(`${apiUrl}/api/work-orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', client_id: '', technician_id: '',
      status: 'pending', priority: 'normal', scheduled_date: '', scheduled_time: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const selectClient = (clientId) => {
    setFormData({ ...formData, client_id: clientId });
    setShowClientSearch(false);
    setClientSearch('');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const translateStatus = (status) => {
    const translations = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return translations[status] || status;
  };

  const translatePriority = (priority) => {
    const translations = {
      'low': 'Baja',
      'normal': 'Normal',
      'high': 'Alta'
    };
    return translations[priority] || priority;
  };

  const statusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const priorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const selectedClient = clients.find(c => c.id === parseInt(formData.client_id));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Órdenes de Trabajo</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancelar' : '+ Nueva Orden'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Orden' : 'Nueva Orden'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Client Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Cliente</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClientSearch(true)}
                  className="w-full px-4 py-2 border rounded-lg text-left focus:ring-2 focus:ring-blue-500"
                >
                  {selectedClient ? selectedClient.name : 'Buscar cliente...'}
                </button>

                {showClientSearch && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b">
                      <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">No se encontraron clientes</div>
                      ) : (
                        filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => selectClient(client.id)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0"
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-gray-600">{client.phone} • {client.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClientSearch(false)}
                      className="w-full p-2 text-sm text-gray-600 hover:bg-gray-50 border-t"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Técnico</label>
              <select
                value={formData.technician_id}
                onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha Programada</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hora Programada</label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
              />
            </div>
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
                <th className="text-left py-3 px-4">Título</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-left py-3 px-4">Técnico</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-left py-3 px-4">Prioridad</th>
                <th className="text-left py-3 px-4">Fecha</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">No hay órdenes</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{order.id}</td>
                    <td className="py-3 px-4 font-medium">{order.title}</td>
                    <td className="py-3 px-4">{order.client_name || 'N/A'}</td>
                    <td className="py-3 px-4">{order.technician_name || 'Sin asignar'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${statusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${priorityColor(order.priority)}`}>
                        {translatePriority(order.priority)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{order.scheduled_date?.split('T')[0] || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
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