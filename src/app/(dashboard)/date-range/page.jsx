"use client";

import { Fragment, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import styles from './page.module.css';
import AttlogFilters from '@/components/attendance/AttlogFilters/AttlogFilters';

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

export default function DateRangePage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeIds, setEmployeeIds] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [expandedEmployees, setExpandedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudieron cargar los empleados');
      }
      setEmployees(payload.data || []);
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return [];
    return employees.filter((employee) => {
      const name = String(employee.personName || '').toLowerCase();
      const code = String(employee.employeedID || employee.id || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [employeeSearch, employees]);

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => employeeIds.includes(String(employee.employeedID || employee.id))),
    [employeeIds, employees]
  );

  const groupedRecords = useMemo(() => {
    const groups = new Map();

    selectedEmployees.forEach((employee) => {
      const id = String(employee.employeedID || employee.id);
      groups.set(id, {
        employeedID: id,
        personName: employee.personName || id,
        department_name: employee.department_name || '',
        position_name: employee.position_name || '',
        details: [],
      });
    });

    records.forEach((item) => {
      const key = String(item.employeedID || item.personName || '');
      if (!key) return;

      if (!groups.has(key)) {
        groups.set(key, {
          employeedID: key,
          personName: item.personName || key,
          department_name: item.department_name || '',
          position_name: item.position_name || '',
          details: [],
        });
      }

      groups.get(key).details.push(item);
    });

    return Array.from(groups.values());
  }, [records, selectedEmployees]);

  const toggleEmployee = (id) => {
    setEmployeeIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const toggleExpanded = (id) => {
    const normalizedId = String(id);
    setExpandedEmployees((current) =>
      current.includes(normalizedId)
        ? current.filter((selectedId) => selectedId !== normalizedId)
        : [...current, normalizedId]
    );
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('summary', '1');
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      employeeIds.forEach((id) => params.append('employeedID', id));
      if (employeeIds.length === 0 && employeeSearch.trim()) params.set('search', employeeSearch.trim());

      const response = await fetch(`/api/attlog?${params.toString()}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Error al cargar registros');
      }

      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);

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
      setError('No se pudo cargar la información. Verifica filtros y vuelve a intentar.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetchRecords();
  };

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <div>
          <p className={styles.tag}>Resumen por rango de fechas</p>
          <p className={styles.description}>
            Selecciona un rango de fechas, busca y marca colaboradores para ver ingresos y salidas en un período determinado.
          </p>
        </div>
        <div className={styles.meta}>Total de colaboradores seleccionados: {selectedEmployees.length}</div>
      </section>

      <form className={styles.filters} onSubmit={handleSubmit}>
        <div className={styles.filterRow}>
          <AttlogFilters
            showRange
            useForm={false}
            showDateButton={false}
            showDevice={false}
            showSubmitInDateArea={true}
            submitLabel="Buscar"
            date={fromDate}
            toDate={toDate}
            search={employeeSearch}
            searchResults={filteredEmployees}
            selectedEmployeeIds={employeeIds}
            onEmployeeToggle={toggleEmployee}
            onDateChange={(event) => setFromDate(event.target.value)}
            onToDateChange={(event) => setToDate(event.target.value)}
            onSearchChange={(event) => setEmployeeSearch(event.target.value)}
            onClearSearch={() => setEmployeeSearch('')}
            onSubmit={handleSubmit}
            title="Resumen por rango de fechas"
          />
        </div>

        

        <div className={styles.fieldGroup}>
          <label>Colaboradores seleccionados</label>
          <div className={styles.selectedEmployees}>
            {selectedEmployees.length > 0 ? (
              selectedEmployees.map((employee) => {
                const id = String(employee.employeedID || employee.id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.selectedEmployeeChip}
                    onClick={() => toggleEmployee(id)}
                  >
                    {employee.personName || id}
                    <span aria-hidden="true">×</span>
                  </button>
                );
              })
            ) : (
              <div className={styles.emptySelected}>No hay colaboradores seleccionados</div>
            )}
          </div>
        </div>

        
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterStats}>
        Mostrando <span>{records.length}</span> entradas de colaboradores seleccionados
      </div>

      <div className={styles.tableWrapper }>
        <div className={styles.tableScrollContainer}>
          <table className={styles.table}>
            <thead className={styles.summaryThead}>
              <tr>
                <th className={styles.summaryTh}>Fecha</th>
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
                  <td colSpan="7" className={styles.emptyState}>Cargando registros...</td>
                </tr>
              ) : groupedRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyState}>No hay registros para este filtro.</td>
                </tr>
              ) : (
                groupedRecords.map((group) => {
                  const rowKey = String(group.employeedID || group.personName);
                  const isExpanded = expandedEmployees.includes(String(group.employeedID));
                  return (
                    <Fragment key={rowKey}>
                      <tr className={styles.groupRow} onClick={() => toggleExpanded(String(group.employeedID))}>
                        <td colSpan="7">
                          <div className={styles.groupRowContent}>
                            <div>
                              <span className={styles.groupRowName}>{group.personName || group.employeedID}</span>
                              <span className={styles.groupRowMeta}>{group.details.length} día(s) en el rango</span>
                            </div>
                            <span className={styles.expandChevron}>{isExpanded ? '▾' : '▸'}</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        group.details.map((item) => (
                          <tr key={`${group.employeedID}-${item.authDate}`} className={styles.detailRow}>
                            <td>{item.authDate || '—'}</td>
                            <td className={styles.employeeName}>{item.personName || item.employeedID}</td>
                            <td>{item.department_name || 'Sin departamento'}</td>
                            <td>{item.position_name || 'Sin cargo'}</td>
                            <td className={getEntryTimeClass(item.first_entry)}>
                              {item.first_entry ? formatDate(item.first_entry) : '—'}
                            </td>
                            <td className={getExitTimeClass(item.last_exit)}>
                              {item.last_exit ? formatDate(item.last_exit) : '—'}
                            </td>
                            <td>
                              {item.record_times ? (
                                <div className={styles.recordTimes}>
                                  {parseRecordTimes(item.record_times).map((record, index) => (
                                    <span
                                      key={`${item.employeedID}-${item.authDate}-${index}`}
                                      className={getRecordClass(record.device)}
                                    >
                                      {record.time}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
