import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, apiUrl }) {
  const [stats, setStats] = useState({ technicians: 0, workOrders: 0, materials: 0, clients: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [techRes, ordersRes, matRes, clientsRes] = await Promise.all([
        fetch(`${apiUrl}/api/technicians`, { headers }),
        fetch(`${apiUrl}/api/work-orders`, { headers }),
        fetch(`${apiUrl}/api/materials`, { headers }),
        fetch(`${apiUrl}/api/clients`, { headers })
      ]);

      const techs = await techRes.json();
      const orders = await ordersRes.json();
      const mats = await matRes.json();
      const clients = await clientsRes.json();

      setStats({
        technicians: techs.length,
        workOrders: orders.length,
        materials: mats.length,
        clients: clients.length
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const statusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Técnicos</p>
              <p className="text-3xl font-bold text-blue-600">{stats.technicians}</p>
            </div>
            <div className="text-4xl">👷</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Órdenes</p>
              <p className="text-3xl font-bold text-green-600">{stats.workOrders}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Materiales</p>
              <p className="text-3xl font-bold text-purple-600">{stats.materials}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Clientes</p>
              <p className="text-3xl font-bold text-orange-600">{stats.clients}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Órdenes Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Título</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-left py-3 px-4">Técnico</th>
                <th className="text-left py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">No hay órdenes</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{order.id}</td>
                    <td className="py-3 px-4">{order.title}</td>
                    <td className="py-3 px-4">{order.client_name || 'N/A'}</td>
                    <td className="py-3 px-4">{order.technician_name || 'Sin asignar'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${statusColor(order.status)}`}>
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