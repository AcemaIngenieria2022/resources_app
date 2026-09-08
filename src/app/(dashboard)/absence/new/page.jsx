"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faCheckCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';

const initialForm = {
  employee_id: '',
  type: 'single',
  start_date: '',
  end_date: '',
  reason: '',
  notes: '',
};

export default function NewAbsencePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/employees')
      .then((response) => response.json())
      .then((payload) => setEmployees(payload?.data || []))
      .catch(() => setStatus({ type: 'error', message: 'No se pudieron cargar los colaboradores' }));
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);
    const response = await fetch('/api/admin/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, end_date: form.type === 'single' ? form.start_date : form.end_date }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok || !payload?.success) {
      setStatus({ type: 'error', message: payload?.error || 'No se pudo registrar la novedad' });
      return;
    }
    setStatus({ type: 'success', message: 'Novedad registrada correctamente' });
    setForm(initialForm);
  }

  return (
    <main className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerIcon}><FontAwesomeIcon icon={faCalendarPlus} /></div>
        <div>
          <h1>Registrar novedad</h1>
          <p>Registra una ausencia de un colaborador para un día o para un periodo continuo.</p>
        </div>
      </header>

      {status && (
        <div className={`${styles.alert} ${status.type === 'success' ? styles.success : styles.error}`}>
          <FontAwesomeIcon icon={status.type === 'success' ? faCheckCircle : faCircleInfo} />
          {status.message}
        </div>
      )}

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formIntro}>
          <div><span>Formulario de novedades</span><h2>Datos de la ausencia</h2></div>
          <span className={styles.requiredHint}>* Campos requeridos</span>
        </div>

        <label className={styles.formLabel}>Colaborador <b>*</b>
          <select className={styles.formControl} name="employee_id" value={form.employee_id} onChange={updateField} required>
            <option value="">Selecciona un colaborador</option>
            {employees.filter((employee) => employee.active).map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.personName} · {employee.employeedID}</option>
            ))}
          </select>
        </label>

        <fieldset className={styles.durationFieldset}>
          <legend className={styles.formLegend}>Duración</legend>
          <div className={styles.segmented}>
            <label className={`${styles.segmentOption} ${form.type === 'single' ? styles.selected : ''}`}><input className={styles.radioInput} type="radio" name="type" value="single" checked={form.type === 'single'} onChange={updateField} /> Día único</label>
            <label className={`${styles.segmentOption} ${form.type === 'series' ? styles.selected : ''}`}><input className={styles.radioInput} type="radio" name="type" value="series" checked={form.type === 'series'} onChange={updateField} /> Serie de días</label>
          </div>
        </fieldset>

        <div className={styles.dateGrid}>
          <label className={styles.formLabel}>Fecha de inicio <b>*</b><input className={styles.formControl} type="date" name="start_date" value={form.start_date} onChange={updateField} required /></label>
          {form.type === 'series' && <label className={styles.formLabel}>Fecha final <b>*</b><input className={styles.formControl} type="date" name="end_date" min={form.start_date} value={form.end_date} onChange={updateField} required /></label>}
        </div>

        <label className={styles.formLabel}>Motivo <b>*</b><input className={styles.formControl} name="reason" value={form.reason} onChange={updateField} placeholder="Ej: Vacaciones, incapacidad, trabajo remoto..." required maxLength={100} /></label>
        <label className={styles.formLabel}>Notas <span>(opcional)</span><textarea className={styles.formControl} name="notes" value={form.notes} onChange={updateField} rows="4" placeholder="Agrega información adicional" /></label>

        <div className={styles.actions}>
          <button type="button" onClick={() => router.push('/leave-requests')}>Cancelar</button>
          <button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar novedad'}</button>
        </div>
      </form>
    </main>
  );
}