'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import AttlogFilters from '@/components/attendance/AttlogFilters/AttlogFilters';
import styles from './page.module.css';

const getToday = () => new Date().toISOString().slice(0, 10);

export default function AbsentPage() {
  const [date, setDate] = useState(getToday());
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [sortBy, setSortBy] = useState('department_name');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/absent?date=${encodeURIComponent(date)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || 'No se pudieron cargar los ausentes');
        if (!cancelled) setRecords(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
          setRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [date]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return records.filter((record) => !normalizedSearch
      || [record.personName, record.employeedID, record.department_name, record.position_name]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
  }, [records, search]);

  const groups = useMemo(() => {
    const grouped = new Map();
    filteredRecords.forEach((record) => {
      const department = record.department_name || 'Sin departamento';
      if (!grouped.has(department)) grouped.set(department, []);
      grouped.get(department).push(record);
    });
    const compare = (left, right, key) => String(left[key] || '').localeCompare(String(right[key] || ''), 'es', { sensitivity: 'base', numeric: true });
    const departments = [...grouped.keys()].sort((left, right) => {
      const result = left.localeCompare(right, 'es', { sensitivity: 'base' });
      return sortBy === 'department_name' && sortDir === 'desc' ? -result : result;
    });
    departments.forEach((department) => {
      grouped.get(department).sort((left, right) => {
        const result = compare(left, right, sortBy);
        return sortDir === 'desc' ? -result : result;
      });
    });
    return departments.map((department) => ({ department, records: grouped.get(department) }));
  }, [filteredRecords, sortBy, sortDir]);

  const sortLabel = (column) => sortBy === column ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <div>
          <p className={styles.tag}>Asistencia por departamento</p>
 
          <p className={styles.description}>Consulta los colaboradores sin marcación en la fecha seleccionada.</p>
        </div>
        <div className={styles.meta}>Total de ausentes: {filteredRecords.length}</div>
      </section>

      <AttlogFilters
        date={date}
        search={search}
        device="all"
        loading={loading}
        onDateChange={(event) => setDate(event.target.value)}
        onSearchChange={(event) => setSearch(event.target.value)}
        onClearSearch={() => setSearch('')}
        onSubmit={(event) => event.preventDefault()}
        showDevice={false}
        title="Filtros de ausentes"
      />

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.tableWrapper}>
        <div className={styles.tableScrollContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('personName')}>Colaborador{sortLabel('personName')}</button></th>
                <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('department_name')}>Departamento{sortLabel('department_name')}</button></th>
                <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('position_name')}>Cargo{sortLabel('position_name')}</button></th>
                <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('absence_date')}>Fecha{sortLabel('absence_date')}</button></th>
              </tr>
            </thead>
            <tbody>
              {groups.length ? groups.map(({ department, records: departmentRecords }) => (
                <Fragment key={department}>
                  <tr className={styles.departmentRow}><td colSpan="4">{department} ({departmentRecords.length})</td></tr>
                  {departmentRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.personName}</td>
                      <td>{department}</td>
                      <td>{record.position_name || 'Sin cargo'}</td>
                      <td>{record.absence_date}</td>
                    </tr>
                  ))}
                </Fragment>
              )) : (
                <tr><td colSpan="4" className={styles.emptyRow}>{loading ? 'Cargando ausentes...' : 'No hay ausentes para la fecha seleccionada.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}