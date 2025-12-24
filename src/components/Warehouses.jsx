import React, { useState, useEffect } from 'react';

export default function Warehouses({ token, apiUrl }) {
  const [warehouses, setWarehouses] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    technician_id: '',
    is_main: false
  });

  const [transferData, setTransferData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    material_id: '',
    quantity: 0
  });

  useEffect(() => {
    fetchWarehouses();
    fetchTechnicians();
    fetchMaterials();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/warehouses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWarehouses(data);
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

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async (warehouseId) => {
    try {
      const res = await fetch(`${apiUrl}/api/warehouses/${warehouseId}/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setInventory(data);
      setSelectedWarehouse(warehouseId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${apiUrl}/api/warehouses/${editingId}`
        : `${apiUrl}/api/warehouses`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchWarehouses();
        resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/warehouses/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
      });

      if (res.ok) {
        alert('✅ Transferencia exitosa');
        fetchWarehouses();
        if (selectedWarehouse) {
          fetchInventory(selectedWarehouse);
        }
        setShowTransfer(false);
        setTransferData({ from_warehouse_id: '', to_warehouse_id: '', material_id: '', quantity: 0 });
      } else {
        const error = await res.json();
        alert('❌ Error: ' + error.error);
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleEdit = (warehouse) => {
    setFormData({
      name: warehouse.name,
      technician_id: warehouse.technician_id || '',
      is_main: warehouse.is_main
    });
    setEditingId(warehouse.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta bodega?')) return;
    
    try {
      await fetch(`${apiUrl}/api/warehouses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchWarehouses();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', technician_id: '', is_main: false });
    setEditingId(null);
    setShowForm(false);
  };

  const mainWarehouse = warehouses.find(w => w.is_main);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Bodegas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
          >
            🔄 Transferir
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            {showForm ? 'Cancelar' : '+ Nueva Bodega'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Bodega' : 'Nueva Bodega'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Técnico Asignado</label>
              <select
                value={formData.technician_id}
                onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Sin asignar (Bodega Central)</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_main}
                onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Bodega Principal</label>
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

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Transferir Materiales</h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bodega Origen *</label>
                <select
                  value={transferData.from_warehouse_id}
                  onChange={(e) => setTransferData({ ...transferData, from_warehouse_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bodega Destino *</label>
                <select
                  value={transferData.to_warehouse_id}
                  onChange={(e) => setTransferData({ ...transferData, to_warehouse_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Material *</label>
                <select
                  value={transferData.material_id}
                  onChange={(e) => setTransferData({ ...transferData, material_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad *</label>
                <input
                  type="number"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Transferir
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransfer(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouses List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map(warehouse => (
          <div key={warehouse.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {warehouse.name}
                  {warehouse.is_main && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Principal</span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {warehouse.technician_name || 'Sin técnico asignado'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchInventory(warehouse.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  📦 Ver Inventario
                </button>
                <button
                  onClick={() => handleEdit(warehouse)}
                  className="text-green-600 hover:text-green-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(warehouse.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>

            {selectedWarehouse === warehouse.id && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2">Inventario:</h4>
                {inventory.length === 0 ? (
                  <p className="text-gray-500 text-sm">Sin materiales</p>
                ) : (
                  <div className="space-y-2">
                    {inventory.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}