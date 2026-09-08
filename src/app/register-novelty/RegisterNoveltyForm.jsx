'use client';

import { useState } from 'react';
import styles from './page.module.css';

const initialForm = {
  permission_type: 'days', leave_class: '', email: '', phone: '', start_date: '', end_date: '',
  permission_date: '', start_time: '', end_time: '', reason: '', attachment: null,
};

export default function RegisterNoveltyForm() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manejador genérico para inputs, selects y textareas
  const handleChange = (e) => {
    const { id, name, value, type, files } = e.target;
    const fieldName = id || name;
    setForm(prev => ({
      ...prev,
      [fieldName]: type === 'file' ? (files?.[0] || null) : value
    }));
  };

  // Manejador específico para campos numéricos que limpian caracteres no numéricos
  const handleNumericChange = (setter, regex) => (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (regex && !regex.test(val) && val !== '') return;
    setter(val);
  };

  async function validateDocument(event) {
    event.preventDefault();
    if (!/^\d{4,20}$/.test(documentNumber)) {
      setMessage({ type: 'error', text: 'El documento debe contener únicamente números, sin puntos, comas ni espacios.' });
      return;
    }
    setLoading(true); setMessage(null); setEmployee(null);
    try {
      const response = await fetch('/api/employees/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identification_id: documentNumber })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No fue posible validar el documento.');
      setEmployee(payload.data);
      setForm(current => ({ ...current, email: payload.data.email || '' }));
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    if (!/^\d{7,15}$/.test(form.phone)) {
      setMessage({ type: 'error', text: 'El celular debe contener únicamente números, entre 7 y 15 dígitos.' });
      return;
    }
    if (form.permission_type === 'days') {
      if (!form.start_date) { setMessage({ type: 'error', text: 'Selecciona la fecha Desde.' }); return; }
      if (!form.end_date) { setMessage({ type: 'error', text: 'Selecciona la fecha Hasta.' }); return; }
      if (totalDays === '') { setMessage({ type: 'error', text: 'La fecha Hasta no puede ser anterior a la fecha Desde.' }); return; }
    } else {
      if (!form.permission_date) { setMessage({ type: 'error', text: 'Selecciona el día de permiso.' }); return; }
      if (!form.start_time) { setMessage({ type: 'error', text: 'Selecciona la hora de inicio.' }); return; }
      if (!form.end_time) { setMessage({ type: 'error', text: 'Selecciona la hora final.' }); return; }
      if (totalHours <= 0) { setMessage({ type: 'error', text: 'La hora Hasta las debe ser posterior a la hora A partir de.' }); return; }
    }

    setLoading(true); setMessage(null);
    const body = new FormData();
    Object.entries({ ...form, attachment: undefined }).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, value);
    });
    body.append('identification_id', documentNumber);
    body.append('total_days', form.permission_type === 'days' && form.start_date && form.end_date
      ? ((new Date(`${form.end_date}T00:00:00`) - new Date(`${form.start_date}T00:00:00`)) / 86400000 + 1).toString()
      : '');
    if (form.attachment) body.append('attachment', form.attachment);

    try {
      const response = await fetch('/api/leave-requests/public', { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No fue posible registrar la novedad.');
      setMessage({ type: 'success', text: 'Tu novedad fue registrada y quedó pendiente de aprobación.' });
      setEmployee(null); setDocumentNumber(''); setForm(initialForm);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  // Cálculos derivados
  const startDateValue = form.start_date ? new Date(`${form.start_date}T00:00:00Z`).getTime() : NaN;
  const endDateValue = form.end_date ? new Date(`${form.end_date}T00:00:00Z`).getTime() : NaN;
  const totalDaysValue = Number.isFinite(startDateValue) && Number.isFinite(endDateValue) && endDateValue >= startDateValue
    ? (endDateValue - startDateValue) / 86400000 + 1
    : null;
  const totalDays = totalDaysValue === null ? '' : String(totalDaysValue);

  const startTimeValue = form.start_time ? new Date(`1970-01-01T${form.start_time}:00Z`).getTime() : NaN;
  const endTimeValue = form.end_time ? new Date(`1970-01-01T${form.end_time}:00Z`).getTime() : NaN;
  const totalHours = Number.isFinite(startTimeValue) && Number.isFinite(endTimeValue)
    ? (endTimeValue - startTimeValue) / 3600000
    : 0;

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
 
        <p className={styles.eyebrow}>Registro de novedades</p>
 
      
        
        {message && <div className={message.type === 'success' ? styles.success : styles.error} role="status">{message.text}</div>}
        
        {!employee ? (
          <form onSubmit={validateDocument} className={styles.form}>
            <label htmlFor="document">Número de documento</label>
            <input 
              id="document" 
              value={documentNumber} 
              onChange={handleNumericChange(setDocumentNumber)} 
              inputMode="numeric" 
              autoComplete="off" 
              maxLength={20} 
              required 
              placeholder="Ej. 1234567890" 
            />
            <button type="submit" disabled={loading}>{loading ? 'Validando...' : 'Continuar'}</button>
          </form>
        ) : (
          <form onSubmit={submitRequest} className={styles.form}>
            <h2 className={styles.sectionTitle}>Datos del colaborador solicitante</h2>
            <div className={styles.employee}>
              <strong>{employee.personName}</strong>
              <span>Correo electrónico: {employee.email || 'Sin correo vinculado'}</span>
              <span>No. de identificación: {employee.identification_id}</span>
              <span>Cargo: {employee.position_name || 'Sin cargo'}</span>
              <span>Departamento: {employee.department_name || 'Sin departamento'}</span>
              <span>Jefe inmediato: {employee.leader_name || 'Sin jefe asignado'}</span>
            </div>

            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={form.email} onChange={handleChange} required placeholder="tu-correo@empresa.com" />

            <label htmlFor="phone">Celular</label>
            <input 
              id="phone" 
              value={form.phone} 
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))} 
              inputMode="numeric" 
              maxLength={15} 
              required 
              placeholder="Ej. 3001234567" 
            />

            <h2 className={styles.sectionTitle}>Datos del permiso solicitado</h2>
            <div className={styles.choiceGroup}>
              <label>
                <input type="radio" name="permission_type" value="days" checked={form.permission_type === 'days'} onChange={handleChange} /> Permiso por días
              </label>
              <label>
                <input type="radio" name="permission_type" value="hours" checked={form.permission_type === 'hours'} onChange={handleChange} /> Permiso por horas
              </label>
            </div>

            {form.permission_type === 'days' ? (
              <div className={styles.gridTwo}>
                <label>Desde<input id="start_date" type="date" value={form.start_date} onChange={handleChange} required /></label>
                <label>Hasta<input id="end_date" type="date" min={form.start_date || undefined} value={form.end_date} onChange={handleChange} required /></label>
                <label>Total días<input value={totalDays} readOnly /></label>
              </div>
            ) : (
              <>
                <label>Día de permiso<input id="permission_date" type="date" value={form.permission_date} onChange={handleChange} required /></label>
                <div className={styles.gridTwo}>
                  <label>A partir de<input id="start_time" type="time" value={form.start_time} onChange={handleChange} required /></label>
                  <label>Hasta las<input id="end_time" type="time" value={form.end_time} onChange={handleChange} required /></label>
                </div>
                <label>Total horas<input value={totalHours > 0 ? `${totalHours} horas` : ''} readOnly /></label>
              </>
            )}

            <label htmlFor="leave_class">Clase de permiso</label>
            <select id="leave_class" value={form.leave_class} onChange={handleChange} required>
              <option value="">Selecciona una opción</option>
              <option>Licencia de maternidad/paternidad</option>
              <option>Calamidad doméstica</option>
              <option>Licencia por luto</option>
              <option>Cita médica</option>
              <option>Ejercicio de derecho al voto</option>
              <option>Día(s) compensatorio(s)</option>
              <option>Vacaciones</option>
              <option>Cargo oficial transitorio de forzosa aceptación</option>
              <option>Otro</option>
            </select>

            <label htmlFor="reason">Motivo del permiso</label>
            <textarea id="reason" value={form.reason} onChange={handleChange} maxLength={500} required placeholder="Describe el motivo del permiso" />

            <label htmlFor="attachment">Documento soporte <span>(opcional: PDF, JPG o PNG, máximo 1 GB)</span></label>
            <input id="attachment" type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleChange} />

            <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Registrar novedad'}</button>
          </form>
        )}
      </section>
    </main>
  );
}