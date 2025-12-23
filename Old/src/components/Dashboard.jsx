import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, apiUrl }) {
  const [stats, setStats] = useState({ technicians: 0, workOrders: 0, materials: 0, clients: 0 });
  const [orders, setOrders] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [techRes, ordersRes, matRes, clientsRes] = await Promise.all([
        fetch(`${apiUrl}/api/technicians`, { headers }),
        fetch(`${apiUrl}/api/work-orders`, { headers }),
        fetch(`${apiUrl}/api/materials`, { headers }),
        fetch(`${apiUrl}/api/clients`, { headers })
      ]);

      const techs = await techRes.json();
      const ordersData = await ordersRes.json();
      const mats = await matRes.json();
      const clients = await clientsRes.json();

      setStats({
        technicians: techs.length,
        workOrders: ordersData.length,
        materials: mats.length,
        clients: clients.length
      });
      setOrders(ordersData);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const getOrdersForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return orders.filter(order => order.scheduled_date === dateStr);
  };

  const changeMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date().toISOString().split('T')[0];

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Técnicos</p>
              <p className="text-3xl font-bold text-red-600">{stats.technicians}</p>
            </div>
            <div className="text-4xl">👷</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Órdenes</p>
              <p className="text-3xl font-bold text-blue-600">{stats.workOrders}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Materiales</p>
              <p className="text-3xl font-bold text-purple-600">{stats.materials}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Clientes</p>
              <p className="text-3xl font-bold text-orange-600">{stats.clients}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Hoy
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            >
              →
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2 bg-gray-100 rounded">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayObj, idx) => {
            const dayOrders = getOrdersForDate(dayObj.date);
            const isToday = dayObj.date.toISOString().split('T')[0] === today;

            return (
              <div
                key={idx}
                className={`min-h-[80px] border rounded p-1 ${
                  !dayObj.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isToday ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
              >
                <div className={`text-xs font-semibold mb-1 ${
                  isToday ? 'text-red-600' : ''
                }`}>
                  {dayObj.day}
                </div>

                <div className="space-y-0.5">
                  {dayOrders.slice(0, 2).map(order => {
                    const color = order.status === 'completed' ? 'bg-green-500' :
                                 order.status === 'in_progress' ? 'bg-blue-500' : 'bg-red-500';
                    return (
                      <div
                        key={order.id}
                        className={`${color} text-white text-[10px] px-1 py-0.5 rounded truncate`}
                        title={order.title}
                      >
                        {order.scheduled_time?.substring(0,5)} {order.title.substring(0,10)}
                      </div>
                    );
                  })}
                  {dayOrders.length > 2 && (
                    <div className="text-[10px] text-gray-500 text-center">
                      +{dayOrders.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>En Progreso</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completada</span>
          </div>
        </div>
      </div>
    </div>
  );
}