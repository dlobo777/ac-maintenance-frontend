import React, { useState, useEffect } from 'react';

export default function Schedule({ token, apiUrl }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const getWeekDays = () => {
    const today = new Date(selectedDate);
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
    // Maneja tanto formato SQLite como PostgreSQL
    const orderDate = order.scheduled_date.split('T')[0];
    return orderDate === dateStr;
  });
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

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const todayOrders = orders.filter(o => o.scheduled_date === selectedDate);
  const weekDays = getWeekDays();

  const statusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Agenda</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Vista Semanal</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const dayOrders = getOrdersForDate(day);
              const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 min-h-[150px] ${
                    isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs text-gray-600">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day.getDay()]}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {dayOrders.slice(0, 3).map(order => (
                      <div
                        key={order.id}
                        className={`text-xs p-2 rounded ${statusColor(order.status)} text-white`}
                        title={order.title}
                      >
                        <div className="truncate font-medium">{order.title}</div>
                        <div className="text-xs opacity-90">{order.scheduled_time || 'Sin hora'}</div>
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Hoy - {selectedDate}</h3>
          
          {todayOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay órdenes para hoy</p>
          ) : (
            <div className="space-y-3">
              {todayOrders.map(order => (
                <div
                  key={order.id}
                  className="border rounded-lg p-3 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{order.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.technician_name || 'Sin asignar'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        🕐 {order.scheduled_time || 'Sin hora'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs text-white ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Todas las Órdenes</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completadas</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Título</th>
                <th className="text-left py-3 px-4">Técnico</th>
                <th className="text-left py-3 px-4">Fecha</th>
                <th className="text-left py-3 px-4">Hora</th>
                <th className="text-left py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">No hay órdenes</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{order.id}</td>
                    <td className="py-3 px-4 font-medium">{order.title}</td>
                    <td className="py-3 px-4">{order.technician_name || 'Sin asignar'}</td>
                    <td className="py-3 px-4">{order.scheduled_date || 'N/A'}</td>
                    <td className="py-3 px-4">{order.scheduled_time || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm text-white ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
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