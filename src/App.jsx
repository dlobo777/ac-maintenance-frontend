import React, { useState, useEffect } from 'react';

export default function Reports({ token, apiUrl }) {
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('orders-by-technician');

  useEffect(() => {
    fetchOrders();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (orders.length > 0 && technicians.length > 0) {
      generateReport();
    }
  }, [selectedYear, selectedMonth, orders, technicians]);

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
      description: 'Próximamente',
      disabled: true
    },
    {
      id: 'client-activity',
      name: 'Actividad de Clientes',
      icon: '👥',
      description: 'Próximamente',
      disabled: true
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
          </div>
        </div>
      </div>
    );
  }