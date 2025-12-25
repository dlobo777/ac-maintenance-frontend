import React, { useState, useEffect } from 'react';

export default function Schedule({ token, apiUrl, setCurrentView }) {
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para cerrar orden
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingOrderId, setClosingOrderId] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [usedMaterials, setUsedMaterials] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchTechnicians();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseInventory(selectedWarehouse);
    }
  }, [selectedWarehouse]);

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

  const fetchWarehouseInventory = async (warehouseId) => {
    try {
      const res = await fetch(`${apiUrl}/api/warehouses/${warehouseId}/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWarehouseInventory(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Función para normalizar fechas (evita problemas de zona horaria)
  const normalizeDateString = (dateStr) => {
    if (!dateStr) return null;
    // Si viene del backend como "2025-12-24T00:00:00.000Z", extraer solo la fecha
    return dateStr.split('T')[0];
  };

  const getWeekDays = () => {
    const today = new Date(selectedDate + 'T12:00:00'); // Agregar hora para evitar problemas de zona
    const days = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getOrdersForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return orders.filter(order => {
      if (!order.scheduled_date) return false;
      const orderDate = normalizeDateString(order.scheduled_date);
      return orderDate === dateStr;
    });
  };

  const handleOrderClick = (orderId) => {
    localStorage.setItem('editOrderId', orderId);
    setCurrentView('work-orders');
  };

  const handleCloseOrder = (orderId) => {
    setClosingOrderId(orderId);
    setShowCloseModal(true);
    setUsedMaterials([]);
    setSelectedWarehouse(null);
  };

  const addMaterial = () => {
    setUsedMaterials([...usedMaterials, { material_id: '', quantity: 0 }]);
  };

  const removeMaterial = (index) => {
    setUsedMaterials(usedMaterials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index, field, value) => {
    const updated = [...usedMaterials];
    updated[index][field] = value;
    setUsedMaterials(updated);
  };

  const submitCloseOrder = async () => {
    if (!selectedWarehouse) {
      alert('Selecciona una bodega');
      return;
    }

    const materials = usedMaterials.map(m => ({
      ...m,
      warehouse_id: selectedWarehouse
    }));

    try {
      const res = await fetch(`${apiUrl}/api/work-orders/${closingOrderId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ materials })
      });

      if (res.ok) {
        alert('✅ Orden cerrada exitosamente');
        fetchOrders();
        setShowCloseModal(false);
        setClosingOrderId(null);
        setUsedMaterials([]);
        setSelectedWarehouse(null);
      } else {
        const error = await res.json();
        alert('❌ Error: ' + error.error);
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const translateStatus = (status) => {
    const translations = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return translations[status] || status;
  };

  // Aplicar todos los filtros simultáneamente
  const filteredOrders = orders.filter(order => {
    // Filtro por estado
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    
    // Filtro por técnico
    if (filterTechnician !== 'all' && order.technician_id !== parseInt(filterTechnician)) return false;
    
    // Filtro por rango de fechas
    if (filterDateFrom || filterDateTo) {
      const orderDate = normalizeDateString(order.scheduled_date);
      if (!orderDate) return false;
      
      if (filterDateFrom && orderDate < filterDateFrom) return false;
      if (filterDateTo && orderDate > filterDateTo) return false;
    }
    
    return true;
  });

  const todayOrders = getOrdersForDate(new Date(selectedDate + 'T12:00:00'));
  const weekDays = getWeekDays();

  const statusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const statusColorBadge = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Agenda</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vista Semanal */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-lg md:text-xl font-bold">Vista Semanal</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 overflow-x-auto">
            {weekDays.map((day, idx) => {
              const dayOrders = getOrdersForDate(day);
              const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-2 md:p-3 min-h-[120px] md:min-h-[150px] ${
                    isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs text-gray-600">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day.getDay()]}
                    </div>
                    <div className={`text-base md:text-lg font-bold ${
                      isToday ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {dayOrders.slice(0, 3).map(order => (
                      <div
                        key={order.id}
                        onClick={() => handleOrderClick(order.id)}
                        className={`text-xs p-1 md:p-2 rounded ${statusColor(order.status)} text-white cursor-pointer hover:opacity-80`}
                        title={`${order.title} - Click para editar`}
                      >
                        <div className="truncate font-medium">{order.title}</div>
                        <div className="text-xs opacity-90 hidden md:block">{order.scheduled_time || 'Sin hora'}</div>
                      </div>
                    ))}
                    {dayOrders.length > 3 && (
                      <div className="text-xs text-center text-gray-500">
                        +{dayOrders.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral - Órdenes del día */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold mb-4">
            {selectedDate === new Date().toISOString().split('T')[0] 
              ? `Hoy - ${selectedDate}` 
              : `Día seleccionado - ${selectedDate}`
            }
          </h3>
          
          {todayOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No hay órdenes para este día</p>
          ) : (
            <div className="space-y-3">
              {todayOrders.map(order => (
                <div
                  key={order.id}
                  className="border rounded-lg p-3 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{order.title}</div>
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        {order.technician_name || 'Sin asignar'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        🕐 {order.scheduled_time || 'Sin hora'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      <span className={`px-2 py-1 rounded text-xs text-white whitespace-nowrap ${statusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOrderClick(order.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {order.status !== 'completed' && (
                          <button
                            onClick={() => handleCloseOrder(order.id)}
                            className="text-green-600 hover:text-green-800 text-xs"
                            title="Cerrar orden"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Todas las Órdenes con Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-4">Todas las Órdenes</h3>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">Técnico</label>
            <select
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Todos los técnicos</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">Fecha Desde</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mb-3 text-sm text-gray-600">
          Mostrando {filteredOrders.length} de {orders.length} órdenes
        </div>

        {/* Tabla responsive */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">ID</th>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">Título</th>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">Técnico</th>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">Fecha</th>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">Hora</th>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">Estado</th>
                <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 text-sm">
                    No hay órdenes que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">#{order.id}</td>
                    <td className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm">{order.title}</td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{order.technician_name || 'Sin asignar'}</td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">
                      {normalizeDateString(order.scheduled_date) || 'N/A'}
                    </td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{order.scheduled_time || 'N/A'}</td>
                    <td className="py-3 px-2 md:px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColorBadge(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 md:px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOrderClick(order.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {order.status !== 'completed' && (
                          <button
                            onClick={() => handleCloseOrder(order.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Cerrar orden"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Order Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Cerrar Orden #{closingOrderId}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Bodega *</label>
              <select
                value={selectedWarehouse || ''}
                onChange={(e) => setSelectedWarehouse(parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Seleccionar bodega...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Materiales Utilizados</label>
                <button
                  onClick={addMaterial}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  disabled={!selectedWarehouse}
                >
                  + Agregar
                </button>
              </div>

              {usedMaterials.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay materiales agregados</p>
              ) : (
                <div className="space-y-2">
                  {usedMaterials.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={item.material_id}
                        onChange={(e) => updateMaterial(index, 'material_id', parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border rounded text-sm"
                      >
                        <option value="">Seleccionar material...</option>
                        {warehouseInventory.map(inv => (
                          <option key={inv.material_id} value={inv.material_id}>
                            {inv.name} (Disponible: {inv.quantity} {inv.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={item.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value))}
                        className="w-20 md:w-24 px-3 py-2 border rounded text-sm"
                        min="1"
                      />
                      <button
                        onClick={() => removeMaterial(index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
              <p className="text-xs md:text-sm text-yellow-800">
                ⚠️ Al cerrar esta orden:
                <ul className="list-disc ml-5 mt-1 text-xs">
                  <li>Se descontarán los materiales de la bodega seleccionada</li>
                  <li>El estado cambiará a "Completada"</li>
                  <li>Se registrará quién cerró la orden</li>
                </ul>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={submitCloseOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition text-sm md:text-base"
              >
                Cerrar Orden
              </button>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setClosingOrderId(null);
                  setUsedMaterials([]);
                  setSelectedWarehouse(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition text-sm md:text-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}