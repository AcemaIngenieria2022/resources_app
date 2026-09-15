'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUserCheck, faClock, faPlus } from '@fortawesome/free-solid-svg-icons';
import styles from '../absent/page.module.css';

const getUrgencyState = (daysRemaining) => {
  const normalizedDays = Number(daysRemaining);
  if (!Number.isFinite(normalizedDays)) return { color: '#64748b' };
  if (normalizedDays <= 15) return { color: '#dc2626' };
  if (normalizedDays <= 30) return { color: '#f59e0b' };
  return { color: '#16a34a' };
};

const formatDate = (value) => {
  if (!value) return 'Sin información';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sin información';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatPaymentType = (value) => {
  const labels = {
    time: 'Tiempo completo',
    money: 'Compensación monetaria',
    time_money: 'Tiempo y compensación monetaria',
  };

  return labels[value] || 'No registrado';
};

const formatRequestType = (value) => (value === 'hours' ? 'Por horas' : 'Por días');

const approvalLabel = (value) => (Number(value) === 1 ? 'Aprobado' : 'Pendiente');

export default function VacationsPage() {
  const [data, setData] = useState({ employees: [], scheduledVacations: [], finalisedVacations: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadVacations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      const response = await fetch('/api/admin/vacations', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo cargar la información de vacaciones');
      }
      setData(payload.data || { employees: [], scheduledVacations: [], finalisedVacations: [], summary: {} });
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Error al cargar vacaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer = setTimeout(() => void loadVacations(), 0);

    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') void loadVacations(false);
    };

    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      clearTimeout(initialLoadTimer);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [loadVacations]);

  const companyOptions = useMemo(
    () => [...new Set(data.employees.map((employee) => employee.company_name).filter(Boolean))].sort((first, second) => first.localeCompare(second, 'es', { sensitivity: 'base' })),
    [data.employees]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data.employees.filter((employee) => {
      const matchesSearch = !normalizedSearch ||
        employee.personName?.toLowerCase().includes(normalizedSearch) ||
        employee.identification_id?.toLowerCase().includes(normalizedSearch) ||
        employee.department_name?.toLowerCase().includes(normalizedSearch) ||
        employee.company_name?.toLowerCase().includes(normalizedSearch);

      const matchesCompany = companyFilter === 'all' || employee.company_name === companyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [companyFilter, data.employees, searchTerm]);

  const filteredFinalisedVacations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data.finalisedVacations.filter((request) => {
      const matchesSearch = !normalizedSearch ||
        request.employee_name?.toLowerCase().includes(normalizedSearch) ||
        request.identification_id?.toLowerCase().includes(normalizedSearch) ||
        request.company_name?.toLowerCase().includes(normalizedSearch) ||
        request.payment_label?.toLowerCase().includes(normalizedSearch);

      const matchesCompany = companyFilter === 'all' || request.company_name === companyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [companyFilter, data.finalisedVacations, searchTerm]);

  const activeEmployees = useMemo(
    () => filteredEmployees.filter((employee) => employee.currentVacation),
    [filteredEmployees]
  );

  if (loading) {
    return <main style={{ padding: '24px' }}>Cargando vacaciones...</main>;
  }

  if (error) {
    return <main style={{ padding: '24px', color: '#b91c1c' }}>{error}</main>;
  }

  return (
    <main className={styles.pageContainer}>
      <div style={{ display: 'grid', gap: '18px' }}>
        <div className={styles.header}>
          <div>
            <p className={styles.tag}>Control de vacaciones</p>
            <h1 className={styles.title}>Vacaciones</h1>
            <p className={styles.description}>Consulta vacaciones programadas, activas y finalizadas de los colaboradores.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadVacations(false)} disabled={refreshing}>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total empleados</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700, color: '#102a43' }}>{data.summary.totalEmployees || 0}</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vacaciones activas</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{data.summary.activeVacations || 0}</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Finalizadas</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700, color: '#0f766e' }}>{data.summary.totalFinalisedVacations || 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, identificación o empresa..."
            style={{
              flex: '1 1 260px',
              minWidth: '220px',
              padding: '10px 12px',
              border: '1px solid #d0d7de',
              borderRadius: '10px',
              background: '#fff',
              color: '#102a43',
              fontSize: '14px',
            }}
          />
          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            style={{
              minWidth: '220px',
              padding: '10px 12px',
              border: '1px solid #d0d7de',
              borderRadius: '10px',
              background: '#fff',
              color: '#102a43',
              fontSize: '14px',
            }}
          >
            <option value="all">Todas las empresas</option>
            {companyOptions.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>

        <section className={styles.tableWrapper}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <FontAwesomeIcon icon={faUserCheck} style={{ color: '#36BBA7' }} />
            <strong style={{ color: '#102a43' }}>Colaboradores en vacaciones</strong>
          </div>
          <div style={{ padding: '0 12px 10px' }}>
            {activeEmployees.length === 0 ? (
              <p style={{ padding: '18px 0 0', color: '#64748b', margin: 0 }}>No hay colaboradores en vacaciones en este momento.</p>
            ) : (
              <div style={{ display: 'grid', gap: '6px', marginTop: '8px' }}>
                {activeEmployees.map((employee) => (
                  <div key={employee.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#102a43' }}>{employee.personName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tipo</div>
                      <div style={{ color: '#0f766e', fontWeight: 600 }}>{formatPaymentType(employee.vacation_payment_type)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fechas</div>
                      <div style={{ color: '#102a43', fontWeight: 600 }}>{formatDate(employee.currentVacation.start_date)} - {formatDate(employee.currentVacation.end_date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.tableWrapper}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#f59e0b' }} />
            <strong style={{ color: '#102a43' }}>Vacaciones programadas</strong>
          </div>
          <div className={styles.tableScrollContainer}>
            {data.scheduledVacations.length === 0 ? (
              <p style={{ padding: '18px', margin: 0, color: '#64748b' }}>No hay vacaciones programadas.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Empresa</th>
                    <th>Tipo</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scheduledVacations.map((request) => (
                    <tr key={`${request.source}-${request.id}`}>
                      <td>{request.employee_name}</td>
                      <td>{request.company_name}</td>
                      <td>{request.payment_label}</td>
                      <td>{formatDate(request.start_date)}</td>
                      <td>{formatDate(request.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className={styles.tableWrapper}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#36BBA7' }} />
            <strong style={{ color: '#102a43' }}>Vacaciones finalizadas</strong>
          </div>
          <div className={styles.tableScrollContainer}>
            <table className={styles.table}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th>Empleado</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Identificación</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Empresa</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Tipo</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Solicitud</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Desde</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Hasta</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Días</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Líder</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>RRHH</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '12px 16px', color: '#36BBA7', borderBottom: '2px solid #36BBA7', background: '#f8fafc' }}>Flujo completo</th>
                </tr>
              </thead>
              <tbody>
                {filteredFinalisedVacations.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '20px 16px', color: '#64748b' }}>No hay vacaciones finalizadas.</td>
                  </tr>
                ) : (
                  filteredFinalisedVacations.map((request) => (
                    <tr key={request.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{request.employee_name}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{request.identification_id}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{request.company_name || 'Sin empresa'}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{request.payment_label}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{formatRequestType(request.permission_type)}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{formatDate(request.start_date)}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{formatDate(request.end_date)}</td>
                      <td style={{ padding: '12px 16px', color: '#102a43' }}>{request.total_days || '—'}</td>
                      <td style={{ padding: '12px 16px', color: request.leader_approved ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{approvalLabel(request.leader_approved)}</td>
                      <td style={{ padding: '12px 16px', color: request.hr_approved ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{approvalLabel(request.hr_approved)}</td>
                      <td style={{ padding: '12px 16px', color: request.all_flows_approved ? '#16a34a' : '#f59e0b', fontWeight: 700 }}>{approvalLabel(request.all_flows_approved)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.tableWrapper}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <FontAwesomeIcon icon={faClock} style={{ color: '#36BBA7' }} />
            <strong style={{ color: '#102a43' }}>Tiempo para vacaciones</strong>
          </div>
          <div className={styles.tableScrollContainer}>
            {filteredEmployees.length === 0 ? (
              <div className={styles.emptyRow}>No hay información disponible.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Empresa</th>
                    <th>Departamento</th>
                    <th>Fecha ingreso</th>
                    <th>Días restantes Vacaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const urgency = getUrgencyState(employee.vacationDaysAvailable);

                    return (
                      <tr key={`${employee.id}-eligibility`}>
                        <td><strong>{employee.personName}</strong></td>
                        <td>{employee.company_name || 'Sin empresa'}</td>
                        <td>{employee.department_name || 'Sin departamento'}</td>
                        <td>{formatDate(employee.hire_date)}</td>
                        <td style={{ color: urgency.color, fontWeight: 700 }}>{employee.vacationDaysAvailable} días</td>
                        <td>
                          <Link href={`/absence/manage?employee_id=${employee.id}`} className={styles.actionButton}>
                            <FontAwesomeIcon icon={faPlus} />
                            Registrar Vacaciones
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
