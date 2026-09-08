"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  faCalendarPlus,
  faClipboardList,
  faEdit,
  faCheckCircle,
  faCircleInfo,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./page.module.css";

const emptyForm = {
  employee_id: "",
  type: "single",
  schedule: "continuous",
  weekday: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  reason: "",
  notes: "",
};

export default function ManageAbsencesPage() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const showAlert = useCallback((text, type = "success") => {
    setMessage({ type, text });
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: type === "success" ? "success" : "error",
      title: text,
      showConfirmButton: false,
      timer: 1700,
      timerProgressBar: true,
    });
  }, []);

  const loadEmployees = useCallback(async () => {
    const response = await fetch("/api/admin/employees");
    const payload = await response.json();
    setEmployees(payload?.data || []);
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/absences");
      const payload = await response.json();
      if (!response.ok || !payload?.success)
        throw new Error(payload?.error || "Error al cargar novedades");
      setRecords(payload.data || []);
    } catch (error) {
      showAlert(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRecords();
      void loadEmployees();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadEmployees, loadRecords]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function registerAbsence(event) {
    event.preventDefault();
    const response = await fetch("/api/admin/absences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        end_date: form.type === "single" ? form.start_date : form.end_date,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      showAlert(payload?.error || "No se pudo registrar", "error");
      return;
    }
    setRegistering(false);
    setForm(emptyForm);
    showAlert("Novedad registrada correctamente");
    await loadRecords();
  }

  async function saveRecord(event) {
    event.preventDefault();
    const response = await fetch("/api/admin/absences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      showAlert(payload?.error || "No se pudo actualizar", "error");
      return;
    }
    setEditing(null);
    showAlert("Novedad actualizada");
    await loadRecords();
  }

  async function removeRecord(record) {
    if (!window.confirm("¿Eliminar esta novedad?")) return;
    const params = new URLSearchParams(
      record.series_id ? { series_id: record.series_id } : { id: record.id },
    );
    const response = await fetch(`/api/admin/absences?${params.toString()}`, {
      method: "DELETE",
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      showAlert(payload?.error || "No se pudo eliminar", "error");
      return;
    }
    showAlert("Novedad eliminada");
    await loadRecords();
  }

  return (
    <main className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.title}>Administración de novedades</h1>
            <p className={styles.description}>
              Registra, consulta y actualiza las novedades de los colaboradores.
            </p>
          </div>
        </div>
      </header>

      {message && (
        <div
          className={`${styles.alert} ${message.type === "success" ? styles.success : styles.error}`}
        >
          <FontAwesomeIcon
            icon={message.type === "success" ? faCheckCircle : faCircleInfo}
          />
          {message.text}
        </div>
      )}

      <section className={styles.recordsPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}></span>
            <h2>Novedades registradas</h2>
          </div>
          <div className={styles.sectionActions}>
            <button
              className={styles.registerButton}
              type="button"
              onClick={() => setRegistering(true)}
            >
              <FontAwesomeIcon icon={faCalendarPlus} /> Registrar novedad
            </button>
          </div>
        </div>
        {loading ? (
          <p className={styles.empty}>Cargando novedades...</p>
        ) : records.length === 0 ? (
          <p className={styles.empty}>No hay novedades registradas.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Departamento</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.personName}</strong>
                      <small>{record.employeedID}</small>
                    </td>
                    <td>{record.department_name || "Sin departamento"}</td>
                    <td>
                      {record.type === "series"
                        ? `${record.start_date} a ${record.end_date}`
                        : `${record.absence_date}${record.type === "hours" ? ` (${record.start_time?.slice(0, 5)} - ${record.end_time?.slice(0, 5)})` : ""}`}
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {record.type === "series"
                          ? record.weekday === null
                            ? "Continua"
                            : "Día específico"
                          : record.type === "hours"
                            ? "Por horas"
                            : "Día único"}
                      </span>
                    </td>
                    <td>{record.reason}</td>
                    <td>{record.notes || "Sin notas"}</td>
                    <td className={styles.actions}>
                      <button
                        title="Editar"
                        onClick={() =>
                          setEditing({
                            id: record.id,
                            employee_id: record.employee_id,
                            type: record.type,
                            schedule:
                              record.weekday === null
                                ? "continuous"
                                : "weekday",
                            weekday: record.weekday ?? "",
                            start_date:
                              record.type === "series"
                                ? record.start_date
                                : record.absence_date,
                            end_date:
                              record.type === "series"
                                ? record.end_date
                                : record.absence_date,
                            start_time: record.start_time?.slice(0, 5) || "",
                            end_time: record.end_time?.slice(0, 5) || "",
                            reason: record.reason,
                            notes: record.notes || "",
                            series_id: record.series_id,
                            original_employee_id: record.employee_id,
                            original_start_date: record.start_date,
                            original_end_date: record.end_date,
                            original_reason: record.reason,
                          })
                        }
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        title="Eliminar"
                        onClick={() => removeRecord(record)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <div className={styles.modalOverlay}>
          <form className={styles.editModal} onSubmit={saveRecord}>
            <h2>Editar novedad</h2>
            <label>
              Colaborador
              <select
                value={editing.employee_id}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    employee_id: Number(event.target.value),
                  })
                }
                required
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.personName}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Duración</legend>
              <div className={styles.segmented}>
                <label>
                  <input
                    type="radio"
                    name="edit_type"
                    value="single"
                    checked={editing.type === "single"}
                    onChange={(event) =>
                      setEditing({ ...editing, type: event.target.value })
                    }
                  />{" "}
                  Día único
                </label>
                <label>
                  <input
                    type="radio"
                    name="edit_type"
                    value="hours"
                    checked={editing.type === "hours"}
                    onChange={(event) =>
                      setEditing({ ...editing, type: event.target.value })
                    }
                  />{" "}
                  Por horas
                </label>
                <label>
                  <input
                    type="radio"
                    name="edit_type"
                    value="series"
                    checked={editing.type === "series"}
                    onChange={(event) =>
                      setEditing({ ...editing, type: event.target.value })
                    }
                  />{" "}
                  Serie
                </label>
              </div>
            </fieldset>
            {editing.type === "series" && (
              <fieldset>
                <legend>Frecuencia</legend>
                <div className={styles.segmented}>
                  <label>
                    <input
                      type="radio"
                      name="edit_schedule"
                      value="continuous"
                      checked={editing.schedule === "continuous"}
                      onChange={(event) =>
                        setEditing({ ...editing, schedule: event.target.value })
                      }
                    />{" "}
                    Todos los días
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="edit_schedule"
                      value="weekday"
                      checked={editing.schedule === "weekday"}
                      onChange={(event) =>
                        setEditing({ ...editing, schedule: event.target.value })
                      }
                    />{" "}
                    Día específico
                  </label>
                </div>
                {editing.schedule === "weekday" && (
                  <select
                    className={styles.inlineSelect}
                    value={editing.weekday}
                    onChange={(event) =>
                      setEditing({ ...editing, weekday: event.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar día</option>
                    <option value="0">Lunes</option>
                    <option value="1">Martes</option>
                    <option value="2">Miércoles</option>
                    <option value="3">Jueves</option>
                    <option value="4">Viernes</option>
                    <option value="5">Sábado</option>
                    <option value="6">Domingo</option>
                  </select>
                )}
              </fieldset>
            )}
            {editing.type === "hours" && (
              <div className={styles.dateGrid}>
                <label>
                  Hora inicial
                  <input
                    type="time"
                    value={editing.start_time}
                    onChange={(event) =>
                      setEditing({ ...editing, start_time: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Hora final
                  <input
                    type="time"
                    value={editing.end_time}
                    onChange={(event) =>
                      setEditing({ ...editing, end_time: event.target.value })
                    }
                    required
                  />
                </label>
              </div>
            )}
            <label>
              Fecha de inicio
              <input
                type="date"
                value={editing.start_date}
                onChange={(event) =>
                  setEditing({ ...editing, start_date: event.target.value })
                }
                required
              />
            </label>
            {editing.type === "series" && (
              <label>
                Fecha final
                <input
                  type="date"
                  min={editing.start_date}
                  value={editing.end_date}
                  onChange={(event) =>
                    setEditing({ ...editing, end_date: event.target.value })
                  }
                  required
                />
              </label>
            )}
            <label>
              Motivo
              <input
                value={editing.reason}
                onChange={(event) =>
                  setEditing({ ...editing, reason: event.target.value })
                }
                required
                maxLength={100}
              />
            </label>
            <label>
              Notas
              <textarea
                value={editing.notes}
                onChange={(event) =>
                  setEditing({ ...editing, notes: event.target.value })
                }
                rows="4"
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="submit">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
      {registering && (
        <div
          className={styles.modalOverlay}
          onClick={() => setRegistering(false)}
        >
          <form
            className={styles.editModal}
            onSubmit={registerAbsence}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Registrar novedad</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setRegistering(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <label>
              Colaborador
              <select
                value={form.employee_id}
                name="employee_id"
                onChange={updateForm}
                required
              >
                <option value="">Seleccionar colaborador</option>
                {employees
                  .filter((employee) => employee.active)
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.personName}
                    </option>
                  ))}
              </select>
            </label>
            <fieldset>
              <legend>Duración</legend>
              <div className={styles.segmented}>
                <label>
                  <input
                    type="radio"
                    name="type"
                    value="single"
                    checked={form.type === "single"}
                    onChange={updateForm}
                  />{" "}
                  Día único
                </label>
                <label>
                  <input
                    type="radio"
                    name="type"
                    value="hours"
                    checked={form.type === "hours"}
                    onChange={updateForm}
                  />{" "}
                  Por horas
                </label>
                <label>
                  <input
                    type="radio"
                    name="type"
                    value="series"
                    checked={form.type === "series"}
                    onChange={updateForm}
                  />{" "}
                  Serie
                </label>
              </div>
            </fieldset>
            {form.type === "hours" && (
              <div className={styles.dateGrid}>
                <label>
                  Hora inicial
                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={updateForm}
                    required
                  />
                </label>
                <label>
                  Hora final
                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={updateForm}
                    required
                  />
                </label>
              </div>
            )}
            {form.type === "series" && (
              <fieldset>
                <legend>Frecuencia</legend>
                <div className={styles.segmented}>
                  <label>
                    <input
                      type="radio"
                      name="schedule"
                      value="continuous"
                      checked={form.schedule === "continuous"}
                      onChange={updateForm}
                    />{" "}
                    Todos los días
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="schedule"
                      value="weekday"
                      checked={form.schedule === "weekday"}
                      onChange={updateForm}
                    />{" "}
                    Día específico
                  </label>
                </div>
                {form.schedule === "weekday" && (
                  <select
                    className={styles.inlineSelect}
                    name="weekday"
                    value={form.weekday}
                    onChange={updateForm}
                    required
                  >
                    <option value="">Seleccionar día</option>
                    <option value="0">Lunes</option>
                    <option value="1">Martes</option>
                    <option value="2">Miércoles</option>
                    <option value="3">Jueves</option>
                    <option value="4">Viernes</option>
                    <option value="5">Sábado</option>
                    <option value="6">Domingo</option>
                  </select>
                )}
              </fieldset>
            )}
            <div className={styles.dateGrid}>
              <label>
                Fecha de inicio
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={updateForm}
                  required
                />
              </label>
              {form.type === "series" && (
                <label>
                  Fecha final
                  <input
                    type="date"
                    name="end_date"
                    min={form.start_date}
                    value={form.end_date}
                    onChange={updateForm}
                    required
                  />
                </label>
              )}
            </div>
            <label>
              Motivo
              <input
                name="reason"
                value={form.reason}
                onChange={updateForm}
                required
                maxLength={100}
              />
            </label>
            <label>
              Notas
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateForm}
                rows="3"
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setRegistering(false)}>
                Cancelar
              </button>
              <button type="submit">Registrar novedad</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
