"use client";

import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import AttlogFilters from '@/components/attendance/AttlogFilters/AttlogFilters';
import { downloadPdf, downloadXlsx } from '@/lib/export';
import styles from './page.module.css';

const getDeviceCellClass = (device) => {
  const normalized = String(device ?? '').trim().toUpperCase();
  if (normalized === 'INTERNO') return styles.deviceInternal;
  if (normalized === 'EXTERNO') return styles.deviceExternal;
  return styles.deviceOther;
};

const getDeviceTextColor = (device) => {
  const normalized = String(device ?? '').trim().toUpperCase();
  if (normalized === 'INTERNO') return '#16a34a';
  if (normalized === 'EXTERNO') return '#548dd2';
  return 'inherit';
};

export default function AllRecordsPage() {
  const [records, setRecords] = useState([]);
  const [limit, setLimit] = useState('all');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [device, setDevice] = useState('all');
  const [sortBy, setSortBy] = useState('authDateTime');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = async (
    selectedDevice = device,
    selectedSortBy = sortBy,
    selectedSortDir = sortDir
  ) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('limit', limit);
      if (date) params.set('date', date);
      if (search) params.set('search', search);
      if (selectedDevice && selectedDevice !== 'all') params.set('device', selectedDevice);
      if (selectedSortBy) params.set('sortBy', selectedSortBy);
      if (selectedSortDir) params.set('sortDir', selectedSortDir);

      const response = await fetch(`/api/attlog?${params.toString()}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Error al cargar registros');
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : [];
      setRecords(records);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Registros cargados',
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los registros.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const initialSearchRef = useRef(true);

  useEffect(() => {
    if (!date) return;

    const timer = setTimeout(() => {
      fetchRecords(device, sortBy, sortDir);
    }, 150);

    return () => clearTimeout(timer);
  }, [search, date, device, limit, sortBy, sortDir]);

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchRecords(device, sortBy, sortDir);
  };

  const handleDeviceChange = (nextDevice) => {
    setDevice(nextDevice);
    fetchRecords(nextDevice, sortBy, sortDir);
  };

  const handleSort = (column) => {
    const nextDir = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDir(nextDir);
    fetchRecords(device, column, nextDir);
  };

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <div>
          <p className={styles.tag}>Registros de asistencia por dispositivo</p>
          
          <p className={styles.description}>
            Selecciona la fecha y busca por nombre para ver registros de los colaboradores por dispositivo.
          </p>
        </div>
        <div className={styles.meta}>Total de registros del día: {records.length}</div>
      </section>

      <AttlogFilters
        date={date}
        search={search}
        device={device}
        loading={loading}
        onDateChange={(event) => setDate(event.target.value)}
        onSearchChange={(event) => setSearch(event.target.value)}
        onDeviceChange={handleDeviceChange}
        onClearSearch={() => setSearch('')}
        onSubmit={handleSubmit}
        onExportPdf={() => downloadPdf(JSON.stringify(records, null, 2), `attendance-${date}.pdf`)}
        onExportExcel={() => downloadXlsx(records, `attendance-${date}.xlsx`)}
      />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrapper}>
        <div className={styles.tableScrollContainer}>
          <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('employeedID')}
                >
                  ID Empleado
                  <span className={styles.sortIndicator}>
                    {sortBy === 'employeedID' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('personName')}
                >
                  Nombre
                  <span className={styles.sortIndicator}>
                    {sortBy === 'personName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('authDateTime')}
                >
                  Fecha/Hora
                  <span className={styles.sortIndicator}>
                    {sortBy === 'authDateTime' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('authDate')}
                >
                  Fecha
                  <span className={styles.sortIndicator}>
                    {sortBy === 'authDate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('authTime')}
                >
                  Hora
                  <span className={styles.sortIndicator}>
                    {sortBy === 'authTime' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('diviceName')}
                >
                  Dispositivo
                  <span className={styles.sortIndicator}>
                    {sortBy === 'diviceName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className={styles.sortHeaderButton}
                  onClick={() => handleSort('deviceSN')}
                >
                  Serial
                  <span className={styles.sortIndicator}>
                    {sortBy === 'deviceSN' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((row, index) => (
                <tr key={`${row.employeedID}-${index}`}>
                  <td>{row.employeedID}</td>
                  <td>{row.personName}</td>
                  <td>{row.authDateTime}</td>
                  <td>{row.authDate}</td>
                  <td>{row.authTime ?? '-'}</td>
                  <td className={getDeviceCellClass(row.diviceName)} style={{ color: getDeviceTextColor(row.diviceName) }}>
                    {row.diviceName}
                  </td>
                  <td>{row.deviceSN}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={styles.emptyRow}>
                  {loading ? 'Cargando registros...' : 'No se encontraron registros en la tabla attlog. Favor validar filtros de búsqueda o la fecha seleccionada.'}
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
