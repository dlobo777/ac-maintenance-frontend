import React, { useState, useEffect } from 'react';

export default function Reports({ token, apiUrl }) {
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [orderMaterials, setOrderMaterials] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState([]);
  const [clientActivityData, setClientActivityData] = useState([]);
  const [materialUsageData, setMaterialUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('orders-by-technician');
  
  // Filtros para uso de materiales
  const [materialsYear, setMaterialsYear] = useState(new Date().getFullYear());
  const [materialsMonth, setMaterialsMonth] = useState('all');
  const [materialsTechnician, setMaterialsTechnician] = useState('all');

  useEffect(() => {
    fetchOrders();
    fetchTechnicians();
    fetchClients();
    fetchMaterials();
    fetchOrderMaterials();
  }, []);

  useEffect(() => {
    if (orders.length > 0 && technicians.length > 0) {
      generateReport();
    }
    if (orders.length > 0 && clients.length > 0) {
      generateClientActivityReport();
    }
    if (orders.length > 0 && materials.length > 0 && orderMaterials.length > 0 && technicians.length > 0) {
      generateMaterialUsageReport();
    }
  }, [selectedYear, selectedMonth, orders, technicians, clients, materials, orderMaterials, materialsYear, materialsMonth, materialsTechnician]);

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
      setTechnicians(data);
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

  const fetchOrderMaterials = async () => {
    try {
      // Obtener todos los materiales usados en órdenes
      const allOrderMaterials = [];
      for (const order of orders) {
        const res = await fetch(`${apiUrl}/api/work-orders/${order.id}/materials`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        data.forEach(mat => {
          allOrderMaterials.push({
            ...mat,
            order_id: order.id,
            technician_id: order.technician_id,
            scheduled_date: order.scheduled_date
          });
        });
      }
      setOrderMaterials(allOrderMaterials);
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = () => {
    setLoading(true);

    // Filtrar órdenes del mes/año seleccionado
    const filteredOrders = orders.filter(order => {
      if (!order.scheduled_date) return false;
      const orderDate = new Date(order.scheduled_date);
      return orderDate.getFullYear() === selectedYear && 
             (orderDate.getMonth() + 1) === selectedMonth;
    });

    // Crear estructura de reporte
    const report = technicians.map(tech => {
      const techOrders = filteredOrders.filter(order => order.technician_id === tech.id);
      
      return {
        technician_id: tech.id,
        technician_name: tech.name,
        pending: techOrders.filter(o => o.status === 'pending').length,
        in_progress: techOrders.filter(o => o.status === 'in_progress').length,
        completed: techOrders.filter(o => o.status === 'completed').length,
        cancelled: techOrders.filter(o => o.status === 'cancelled').length,
        total: techOrders.length
      };
    });

    // Agregar fila de órdenes sin técnico asignado
    const unassignedOrders = filteredOrders.filter(order => !order.technician_id);
    if (unassignedOrders.length > 0) {
      report.push({
        technician_id: null,
        technician_name: 'Sin asignar',
        pending: unassignedOrders.filter(o => o.status === 'pending').length,
        in_progress: unassignedOrders.filter(o => o.status === 'in_progress').length,
        completed: unassignedOrders.filter(o => o.status === 'completed').length,
        cancelled: unassignedOrders.filter(o => o.status === 'cancelled').length,
        total: unassignedOrders.length
      });
    }

    // Calcular totales
    const totals = {
      technician_name: 'TOTAL',
      pending: report.reduce((sum, r) => sum + r.pending, 0),
      in_progress: report.reduce((sum, r) => sum + r.in_progress, 0),
      completed: report.reduce((sum, r) => sum + r.completed, 0),
      cancelled: report.reduce((sum, r) => sum + r.cancelled, 0),
      total: report.reduce((sum, r) => sum + r.total, 0)
    };

    setReportData([...report, totals]);
    setLoading(false);
  };

  const generateClientActivityReport = () => {
    const today = new Date();
    
    const report = clients.map(client => {
      // Obtener todas las órdenes completadas del cliente
      const clientOrders = orders.filter(order => 
        order.client_id === client.id && 
        order.status === 'completed' &&
        order.scheduled_date
      );

      if (clientOrders.length === 0) {
        return {
          client_id: client.id,
          client_name: client.name,
          phone: client.phone || 'N/A',
          last_order_date: null,
          projected_date: null,
          days_remaining: null,
          percentage: null,
          status: 'sin-ordenes'
        };
      }

      // Encontrar la fecha de la última orden
      const lastOrder = clientOrders.reduce((latest, order) => {
        const orderDate = new Date(order.scheduled_date);
        return orderDate > new Date(latest.scheduled_date) ? order : latest;
      });

      const lastOrderDate = new Date(lastOrder.scheduled_date);
      
      // Calcular fecha proyectada (4 meses después)
      const projectedDate = new Date(lastOrderDate);
      projectedDate.setMonth(projectedDate.getMonth() + 4);

      // Calcular días totales y días restantes
      const totalDays = Math.floor((projectedDate - lastOrderDate) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.floor((today - lastOrderDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.floor((projectedDate - today) / (1000 * 60 * 60 * 24));
      
      // Calcular porcentaje transcurrido
      const percentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

      // Determinar estado del semáforo
      let status = 'verde'; // < 30%
      if (percentage >= 90) status = 'rojo';
      else if (percentage >= 60) status = 'amarillo';

      return {
        client_id: client.id,
        client_name: client.name,
        phone: client.phone || 'N/A',
        last_order_date: lastOrderDate,
        projected_date: projectedDate,
        days_remaining: daysRemaining,
        percentage: percentage,
        status: status
      };
    });

    // Ordenar por porcentaje (los más urgentes primero)
    report.sort((a, b) => {
      if (a.status === 'sin-ordenes') return 1;
      if (b.status === 'sin-ordenes') return -1;
      return (b.percentage || 0) - (a.percentage || 0);
    });

    setClientActivityData(report);
  };

  const generateMaterialUsageReport = () => {
    // Filtrar materiales de órdenes según los filtros
    let filteredMaterials = orderMaterials.filter(om => {
      if (!om.scheduled_date) return false;
      
      const orderDate = new Date(om.scheduled_date);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth() + 1;

      // Filtro de año (obligatorio)
      if (orderYear !== materialsYear) return false;

      // Filtro de mes (opcional)
      if (materialsMonth !== 'all' && orderMonth !== parseInt(materialsMonth)) return false;

      // Filtro de técnico (opcional)
      if (materialsTechnician !== 'all' && om.technician_id !== parseInt(materialsTechnician)) return false;

      return true;
    });

    // Agrupar por material
    const materialGroups = {};
    filteredMaterials.forEach(om => {
      if (!materialGroups[om.material_id]) {
        const material = materials.find(m => m.id === om.material_id);
        materialGroups[om.material_id] = {
          material_id: om.material_id,
          material_name: material?.name || 'Desconocido',
          unit: material?.unit || '',
          total_quantity: 0,
          by_technician: {}
        };
      }
      
      materialGroups[om.material_id].total_quantity += om.quantity;

      // Agrupar por técnico
      const techId = om.technician_id || 'sin-asignar';
      if (!materialGroups[om.material_id].by_technician[techId]) {
        const tech = technicians.find(t => t.id === om.technician_id);
        materialGroups[om.material_id].by_technician[techId] = {
          technician_name: tech?.name || 'Sin asignar',
          quantity: 0
        };
      }
      materialGroups[om.material_id].by_technician[techId].quantity += om.quantity;
    });

    // Convertir a array y ordenar por cantidad total
    const report = Object.values(materialGroups).sort((a, b) => b.total_quantity - a.total_quantity);

    setMaterialUsageData(report);
  };

  const exportToExcel = () => {
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('es-ES', { month: 'long' });
    
    // Crear HTML para Excel
    let html = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: center; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .pending { background-color: #fef3c7; }
            .in-progress { background-color: #dbeafe; }
            .completed { background-color: #d1fae5; }
            .cancelled { background-color: #fee2e2; }
            .total-row { background-color: #e5e7eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Reporte de Órdenes por Técnico - ${monthName} ${selectedYear}</h2>
          <table>
            <thead>
              <tr>
                <th>Técnico</th>
                <th class="pending">Pendientes</th>
                <th class="in-progress">En Progreso</th>
                <th class="completed">Completadas</th>
                <th class="cancelled">Canceladas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    reportData.forEach((row, index) => {
      const isTotal = row.technician_name === 'TOTAL';
      html += `
        <tr ${isTotal ? 'class="total-row"' : ''}>
          <td>${row.technician_name}</td>
          <td>${row.pending}</td>
          <td>${row.in_progress}</td>
          <td>${row.completed}</td>
          <td>${row.cancelled}</td>
          <td>${row.total}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <br>
          <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
        </body>
      </html>
    `;

    // Crear Blob y descargar
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Ordenes_${monthName}_${selectedYear}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label;

  // Menú de reportes disponibles
  const reportTypes = [
    {
      id: 'orders-by-technician',
      name: 'Órdenes por Técnico',
      icon: '👷',
      description: 'Cantidad de órdenes por técnico según estado'
    },
    {
      id: 'materials-usage',
      name: 'Uso de Materiales',
      icon: '📦',
      description: 'Materiales utilizados por técnico y período'
    },
    {
      id: 'client-activity',
      name: 'Actividad de Clientes',
      icon: '👥',
      description: 'Seguimiento de mantenimientos por cliente'
    },
    {
      id: 'performance',
      name: 'Rendimiento',
      icon: '⚡',
      description: 'Próximamente',
      disabled: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reportes</h2>
          <p className="text-sm text-gray-600 mt-1">Análisis de órdenes de trabajo</p>
        </div>
      </div>

      {/* Layout con submenú lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Submenú lateral */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Tipos de Reporte</h3>
            <nav className="space-y-2">
              {reportTypes.map(report => (
                <button
                  key={report.id}
                  onClick={() => !report.disabled && setSelectedReport(report.id)}
                  disabled={report.disabled}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedReport === report.id
                      ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-semibold'
                      : report.disabled
                      ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{report.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm">{report.name}</div>
                      {report.disabled && (
                        <div className="text-xs text-gray-400 mt-1">{report.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Info adicional */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                💡 <strong>Tip:</strong> Próximamente se agregarán más reportes para un análisis completo de tu negocio.
              </p>
            </div>
          </div>
        </div>

        {/* Contenido del reporte seleccionado */}
        <div className="lg:col-span-3">
          {selectedReport === 'orders-by-technician' && (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  📊 Reporte de Órdenes por Técnico
                </h3>
                <button
                  onClick={exportToExcel}
                  disabled={reportData.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  📥 Exportar a Excel
                </button>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Mes</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Año</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                    <p className="text-sm text-blue-800">
                      <strong>Período:</strong> {selectedMonthName} {selectedYear}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de reporte */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Generando reporte...
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos para el período seleccionado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Técnico</th>
                        <th className="text-center py-3 px-4 font-semibold text-yellow-800 bg-yellow-100">
                          Pendientes
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-blue-800 bg-blue-100">
                          En Progreso
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-green-800 bg-green-100">
                          Completadas
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-red-800 bg-red-100">
                          Canceladas
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-gray-100">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, index) => {
                        const isTotal = row.technician_name === 'TOTAL';
                        return (
                          <tr 
                            key={index} 
                            className={`border-b hover:bg-gray-50 ${
                              isTotal ? 'bg-gray-100 font-bold' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              {isTotal ? (
                                <span className="text-gray-800">{row.technician_name}</span>
                              ) : (
                                <span className="text-gray-700">{row.technician_name}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center bg-yellow-50">
                              <span className={`${row.pending > 0 ? 'text-yellow-800 font-semibold' : 'text-gray-400'}`}>
                                {row.pending}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center bg-blue-50">
                              <span className={`${row.in_progress > 0 ? 'text-blue-800 font-semibold' : 'text-gray-400'}`}>
                                {row.in_progress}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center bg-green-50">
                              <span className={`${row.completed > 0 ? 'text-green-800 font-semibold' : 'text-gray-400'}`}>
                                {row.completed}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center bg-red-50">
                              <span className={`${row.cancelled > 0 ? 'text-red-800 font-semibold' : 'text-gray-400'}`}>
                                {row.cancelled}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center bg-gray-50">
                              <span className={`${row.total > 0 ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>
                                {row.total}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Leyenda */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-xs font-medium text-gray-700">Pendientes</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <span className="text-xs font-medium text-gray-700">En Progreso</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-xs font-medium text-gray-700">Completadas</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-xs font-medium text-gray-700">Canceladas</span>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>📌 Nota:</strong> Este reporte muestra la cantidad de órdenes por técnico según su estado, 
                  para el período seleccionado. Las órdenes se contabilizan según su fecha programada.
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'client-activity' && (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  👥 Actividad de Clientes
                </h3>
                <button
                  onClick={() => {
                    // Exportar reporte de clientes
                    const html = `
                      <html>
                        <head><meta charset="UTF-8"><title>Actividad de Clientes</title></head>
                        <body>
                          <h2>Reporte de Actividad de Clientes</h2>
                          <table border="1" style="border-collapse: collapse; width: 100%;">
                            <tr>
                              <th>Cliente</th>
                              <th>Teléfono</th>
                              <th>Última Orden</th>
                              <th>Fecha Proyectada</th>
                              <th>Días Restantes</th>
                              <th>Porcentaje</th>
                              <th>Estado</th>
                            </tr>
                            ${clientActivityData.map(row => `
                              <tr>
                                <td>${row.client_name}</td>
                                <td>${row.phone}</td>
                                <td>${row.last_order_date ? row.last_order_date.toLocaleDateString('es-ES') : 'N/A'}</td>
                                <td>${row.projected_date ? row.projected_date.toLocaleDateString('es-ES') : 'N/A'}</td>
                                <td>${row.days_remaining !== null ? row.days_remaining : 'N/A'}</td>
                                <td>${row.percentage !== null ? row.percentage.toFixed(1) + '%' : 'N/A'}</td>
                                <td>${row.status === 'verde' ? '🟢' : row.status === 'amarillo' ? '🟡' : row.status === 'rojo' ? '🔴' : 'Sin órdenes'}</td>
                              </tr>
                            `).join('')}
                          </table>
                          <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
                        </body>
                      </html>
                    `;
                    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Actividad_Clientes_${new Date().toISOString().split('T')[0]}.xls`;
                    a.click();
                  }}
                  disabled={clientActivityData.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  📥 Exportar a Excel
                </button>
              </div>

              {clientActivityData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de clientes
                </div>
              ) : (
                <>
                  {/* Resumen */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-700">
                        {clientActivityData.filter(c => c.status === 'rojo').length}
                      </div>
                      <div className="text-sm text-red-600">🔴 Urgentes (≥90%)</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-700">
                        {clientActivityData.filter(c => c.status === 'amarillo').length}
                      </div>
                      <div className="text-sm text-yellow-600">🟡 Próximos (≥60%)</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">
                        {clientActivityData.filter(c => c.status === 'verde').length}
                      </div>
                      <div className="text-sm text-green-600">🟢 Al día (<60%)</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-700">
                        {clientActivityData.filter(c => c.status === 'sin-ordenes').length}
                      </div>
                      <div className="text-sm text-gray-600">⚪ Sin órdenes</div>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Teléfono</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Última Orden</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Fecha Proyectada</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Días Restantes</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Progreso</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientActivityData.map((row, index) => {
                          const statusBg = row.status === 'rojo' ? 'bg-red-50' :
                                          row.status === 'amarillo' ? 'bg-yellow-50' :
                                          row.status === 'verde' ? 'bg-green-50' : 'bg-gray-50';
                          
                          return (
                            <tr key={index} className={`border-b hover:bg-gray-50 ${statusBg}`}>
                              <td className="py-3 px-4 font-medium">{row.client_name}</td>
                              <td className="py-3 px-4">{row.phone}</td>
                              <td className="py-3 px-4 text-center">
                                {row.last_order_date 
                                  ? row.last_order_date.toLocaleDateString('es-ES')
                                  : 'N/A'
                                }
                              </td>
                              <td className="py-3 px-4 text-center">
                                {row.projected_date 
                                  ? row.projected_date.toLocaleDateString('es-ES')
                                  : 'N/A'
                                }
                              </td>
                              <td className="py-3 px-4 text-center">
                                {row.days_remaining !== null ? (
                                  <span className={`font-semibold ${
                                    row.days_remaining < 0 ? 'text-red-700' : 'text-gray-700'
                                  }`}>
                                    {row.days_remaining < 0 ? 'Vencido' : `${row.days_remaining} días`}
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                {row.percentage !== null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                                      <div 
                                        className={`h-full ${
                                          row.status === 'rojo' ? 'bg-red-500' :
                                          row.status === 'amarillo' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(100, row.percentage)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-semibold w-12 text-right">
                                      {row.percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                ) : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {row.status === 'rojo' && <span className="text-2xl">🔴</span>}
                                {row.status === 'amarillo' && <span className="text-2xl">🟡</span>}
                                {row.status === 'verde' && <span className="text-2xl">🟢</span>}
                                {row.status === 'sin-ordenes' && <span className="text-gray-400">⚪</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Leyenda */}
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>📌 Nota:</strong> Este reporte muestra el seguimiento de mantenimientos por cliente:
                    </p>
                    <ul className="text-sm text-gray-700 list-disc ml-5 space-y-1">
                      <li><strong>Última Orden:</strong> Fecha del último mantenimiento completado</li>
                      <li><strong>Fecha Proyectada:</strong> 4 meses después del último mantenimiento</li>
                      <li><strong>Días Restantes:</strong> Días hasta la fecha proyectada</li>
                      <li><strong>🟢 Verde:</strong> Menos del 30% del tiempo transcurrido (cliente al día)</li>
                      <li><strong>🟡 Amarillo:</strong> Entre 60% y 89% del tiempo transcurrido (próximo a vencer)</li>
                      <li><strong>🔴 Rojo:</strong> 90% o más del tiempo transcurrido (urgente, contactar pronto)</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}