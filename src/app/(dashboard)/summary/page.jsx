'use client';

import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import AttlogFilters from '@/components/attendance/AttlogFilters/AttlogFilters';
import styles from './page.module.css';

const formatDate = (value) => {
  if (!value) return '-';
  const normalized = String(value).replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const parseTimeMinutes = (value) => {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const isLateArrival = (value) => {
  const minutes = parseTimeMinutes(value);
  return minutes !== null && minutes > 7 * 60 + 5;
};

const isEarlyArrival = (value) => {
  const minutes = parseTimeMinutes(value);
  return minutes !== null && minutes < 7 * 60 + 5;
};

const getEntryTimeClass = (value) => {
  if (isEarlyArrival(value)) return styles.timeEarly;
  if (isLateArrival(value)) return styles.timeLate;
  return '';
};

const getExitTimeClass = (value) => {
  const minutes = parseTimeMinutes(value);
  if (minutes === null) return '';
  if (minutes < 16 * 60 + 25) return styles.timeLate;
  if (minutes > 16 * 60 + 25) return styles.timeGreen;
  return '';
};

const parseRecordTimes = (value) => {
  if (!value) return [];
  return String(value)
    .split('||')
    .map((item) => {
      const [time, device] = item.split('|');
      return {
        time: time?.trim() || '',
        device: device?.trim().toUpperCase() || 'UNKNOWN',
      };
    })
    .filter((record) => record.device === 'INTERNO' || record.device === 'EXTERNO');
};

const getRecordClass = (device) => {
  if (device === 'INTERNO') return styles.internalChip;
  if (device === 'EXTERNO') return styles.externalChip;
  return styles.recordChip;
};

const getToday = () => new Date().toISOString().slice(0, 10);

export default function SummaryPage() {
  const [date, setDate] = useState(getToday());
  const [search, setSearch] = useState('');
  const [device, setDevice] = useState('all');
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async (selectedDevice = device) => {
    if (!date) {
      setSummary([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('date', date);
      if (search) params.set('search', search);
      if (selectedDevice && selectedDevice !== 'all') params.set('device', selectedDevice);
      const response = await fetch(`/api/summary?${params.toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      const summaryRecords = Array.isArray(data) ? data : [];
      setSummary(summaryRecords);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Resumen cargado',
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información. Intenta nuevamente.');
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!date) return;

    const timer = setTimeout(() => {
      fetchSummary(device);
    }, 150);

    return () => clearTimeout(timer);
  }, [date, search, device]);

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchSummary(device);
  };

  const handleDeviceChange = (nextDevice) => {
    setDevice(nextDevice);
    fetchSummary(nextDevice);
  };

  const visibleCount = summary.length;
  const totalCount = summary.length;

  const sortedSummary = useMemo(() => summary, [summary]);

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <div>
          <p className={styles.tag}>Resumen de ingresos</p>
          <p className={styles.description}>
            Consulta los primeros y últimos ingresos del día por colaborador, con filtros por fecha, y registros generales.
          </p>
        </div>
        <div className={styles.meta}>Total de registros del día: {totalCount}</div>
      </section>

      <AttlogFilters
        date={date}
        search={search}
        device={device}
        onDateChange={(event) => setDate(event.target.value)}
        onSearchChange={(event) => setSearch(event.target.value)}
        onDeviceChange={handleDeviceChange}
        onClearSearch={() => setSearch('')}
        onSubmit={handleSubmit}
      />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterStats}>
        Mostrando <span>{visibleCount}</span> de <span>{totalCount}</span> colaboradores
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableScrollContainer}>
          <table className={styles.table}>
            <thead className={styles.summaryThead}>
              <tr>
                <th className={styles.summaryTh}>Nombre</th>
                <th className={styles.summaryTh}>Departamento</th>
                <th className={styles.summaryTh}>Cargo</th>
                <th className={styles.summaryTh}>Ingreso</th>
                <th className={styles.summaryTh}>Salida</th>
                <th className={styles.summaryTh}>Registros</th>
              </tr>
            </thead>
            <tbody className={styles.summaryTbody}>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>Cargando registros...</td>
                </tr>
              ) : summary.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>No hay registros para esta fecha.</td>
                </tr>
              ) : (
                sortedSummary.map((item) => (
                  <tr key={`${item.employeedID}-${item.personName}`}>
                    <td className={styles.employeeName}>{item.personName}</td>
                    <td>{item.department_name || 'Sin departamento'}</td>
                    <td>{item.position_name || 'Sin cargo'}</td>
                    <td className={getEntryTimeClass(item.first_entry)}>
                      {item.first_entry ? formatDate(item.first_entry) : 'Sin registro'}
                    </td>
                    <td className={getExitTimeClass(item.last_exit)}>
                      {item.last_exit ? formatDate(item.last_exit) : 'Sin registro'}
                    </td>
                    <td>
                      {item.record_times ? (
                        (() => {
                          const records = parseRecordTimes(item.record_times);
                          return records.length > 0 ? (
                            <div className={styles.recordTimes}>
                              {records.map((record, index) => (
                                <span key={`${item.employeedID}-${index}`} className={getRecordClass(record.device)}>
                                  {record.time}
                                </span>
                              ))}
                            </div>
                          ) : (
                            'Sin registros'
                          );
                        })()
                      ) : (
                        'Sin registros'
                      )}
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
