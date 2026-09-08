"use client";

import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faBriefcase,
  faUsers,
  faPlusCircle,
  faEdit,
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faTimes,
  faFileAlt,
  faSitemap,
  faUserPlus,
  faUserMinus,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';

const Modal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#94a3b8',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}>
      <FontAwesomeIcon icon={isSuccess ? faCheckCircle : faTimesCircle} />
      <span>{message}</span>
    </div>
  );
};

const FormField = ({ label, required, children }) => (
  <div className={styles.formField}>
    <label className={styles.formLabel}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className={styles.formInput}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={styles.formSelect}
  />
);

const TableScroll = ({ children, style }) => (
  <div className={styles.tableWrapper} style={style}>
    <div className={styles.tableScrollContainer}>{children}</div>
  </div>
);

const sortRows = (rows, key, direction) => [...rows].sort((first, second) => {
  const firstValue = String(first[key] ?? '').toLocaleLowerCase();
  const secondValue = String(second[key] ?? '').toLocaleLowerCase();
  const comparison = firstValue.localeCompare(secondValue, 'es', { numeric: true });
  return direction === 'asc' ? comparison : -comparison;
});

export default function CollaboratorsAdminPage() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [sortConfigs, setSortConfigs] = useState({
    departments: { key: 'name', direction: 'asc' },
    positions: { key: 'name', direction: 'asc' },
    employees: { key: 'personName', direction: 'asc' },
  });

  // Modal states
  const [deptModal, setDeptModal] = useState({ isOpen: false, mode: 'add', data: {} });
  const [posModal, setPosModal] = useState({ isOpen: false, mode: 'add', data: {} });
  const [empModal, setEmpModal] = useState({ isOpen: false, mode: 'add', data: {} });

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type === 'success' ? 'success' : 'error',
      title: message,
      showConfirmButton: false,
      timer: 1700,
      timerProgressBar: true,
    });
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/departments');
      const payload = await res.json();
      setDepartments(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar departamentos', 'error');
    }
  }, [showAlert]);

  const loadPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/positions');
      const payload = await res.json();
      setPositions(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar cargos', 'error');
    }
  }, [showAlert]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const payload = await res.json();
      setRoles(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar roles', 'error');
    }
  }, [showAlert]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/employees');
      const payload = await res.json();
      setEmployees(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar empleados', 'error');
    }
  }, [showAlert]);

  const loadLeaders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leader-employees');
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo cargar el catálogo de líderes');
      }
      setLeaders(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar líderes', 'error');
    }
  }, [showAlert]);

  const loadCollaboratorDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/collaborator-documents');
      const payload = await res.json();
      setDocuments(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar documentos', 'error');
    }
  }, [showAlert]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDepartments(), loadPositions(), loadRoles(), loadLeaders(), loadEmployees(), loadCollaboratorDocuments()]);
    } finally {
      setLoading(false);
    }
  }, [loadDepartments, loadEmployees, loadLeaders, loadRoles, loadPositions, loadCollaboratorDocuments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAll();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAll]);

  // Department handlers
  async function handleSaveDepartment(formData) {
    try {
      const action = deptModal.mode === 'add' ? 'add' : 'update';
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...formData,
          ...(deptModal.mode === 'edit' && { id: deptModal.data.id }),
        }),
      });
      const payload = await res.json();
      if (payload?.success) {
        showAlert(payload?.meta?.message || 'Operación exitosa', 'success');
        setDeptModal({ isOpen: false, mode: 'add', data: {} });
        await loadDepartments();
      } else {
        showAlert(payload?.error || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error al guardar', 'error');
    }
  }

  async function handleDeleteDepartment(id) {
    if (!confirm('¿Eliminar departamento?')) return;
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const payload = await res.json();
      if (payload?.success) {
        showAlert('Departamento eliminado', 'success');
        await loadDepartments();
      } else {
        showAlert(payload?.error || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error al eliminar', 'error');
    }
  }

  // Position handlers
  async function handleSavePosition(formData) {
    try {
      const action = posModal.mode === 'add' ? 'add' : 'update';
      const res = await fetch('/api/admin/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...formData,
          ...(posModal.mode === 'edit' && { id: posModal.data.id }),
        }),
      });
      const payload = await res.json();
      if (payload?.success) {
        showAlert(payload?.meta?.message || 'Operación exitosa', 'success');
        setPosModal({ isOpen: false, mode: 'add', data: {} });
        await loadPositions();
      } else {
        showAlert(payload?.error || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error al guardar', 'error');
    }
  }

  async function handleDeletePosition(id) {
    if (!confirm('¿Eliminar cargo?')) return;
    try {
      const res = await fetch('/api/admin/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const payload = await res.json();
      if (payload?.success) {
        showAlert('Cargo eliminado', 'success');
        await loadPositions();
      } else {
        showAlert(payload?.error || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error al eliminar', 'error');
    }
  }

  // Employee handlers
  async function handleSaveEmployee(formData) {
    try {
      const action = empModal.mode === 'add' ? 'add' : 'update';
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...formData,
          ...(empModal.mode === 'edit' && { id: empModal.data.id }),
        }),
      });
      const payload = await res.json();
      if (payload?.success) {
        const employeeId = empModal.mode === 'edit' ? empModal.data.id : payload.data?.id;

        const leaderRes = await fetch('/api/admin/leader-employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_id: employeeId, leader_id: formData.leader_id }),
        });
        const leaderPayload = await leaderRes.json();
        if (!leaderPayload?.success) {
          showAlert(leaderPayload?.error || 'Error al asignar líder', 'error');
          return;
        }
        
        // Guardar documento si se proporciona
        if (formData.document_number && employeeId) {
          try {
            // En edición: si tiene docId existente, actualizar; si no, crear
            // En creación: siempre crear
            let docAction = 'add';
            let docBody = {
              action: 'add',
              employee_id: employeeId,
              document_number: formData.document_number,
            };

            if (empModal.mode === 'edit' && empModal.data.docId) {
              docAction = 'update';
              docBody = {
                action: 'update',
                id: empModal.data.docId,
                document_number: formData.document_number,
              };
            }

            const docRes = await fetch('/api/admin/collaborator-documents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(docBody),
            });
            const docPayload = await docRes.json();
            if (!docPayload?.success) {
              console.warn('Documento no guardado:', docPayload?.error);
            }
          } catch (docError) {
            console.warn('Error al guardar documento:', docError);
          }
        }

        showAlert(payload?.meta?.message || 'Operación exitosa', 'success');
        setEmpModal({ isOpen: false, mode: 'add', data: {} });
        await Promise.all([loadEmployees(), loadLeaders(), loadCollaboratorDocuments()]);
      } else {
        showAlert(payload?.error || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error al guardar', 'error');
    }
  }

  async function handleDeleteEmployee(id) {
    if (!confirm('¿Eliminar empleado?')) return;
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const payload = await res.json();
      if (payload?.success) {
        showAlert('Empleado eliminado', 'success');
        await loadEmployees();
      } else {
        showAlert(payload?.error || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error al eliminar', 'error');
    }
  }

  async function handleAssignEmployees(leaderId, employeeIds) {
    try {
      const responses = await Promise.all(employeeIds.map((employeeId) => fetch('/api/admin/leader-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, leader_id: leaderId }),
      })));
      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) {
        const payload = await failedResponse.json();
        throw new Error(payload?.error || 'No se pudieron guardar las asignaciones');
      }
      showAlert('Asignaciones actualizadas', 'success');
      await Promise.all([loadEmployees(), loadLeaders()]);
    } catch (error) {
      console.error(error);
      showAlert(error.message || 'No se pudieron guardar las asignaciones', 'error');
    }
  }

  async function handleUnassignEmployee(employeeId) {
    try {
      const response = await fetch('/api/admin/leader-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, leader_id: null }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'No se pudo quitar la asignación');
      showAlert('Asignación retirada', 'success');
      await Promise.all([loadEmployees(), loadLeaders()]);
    } catch (error) {
      console.error(error);
      showAlert(error.message || 'No se pudo quitar la asignación', 'error');
    }
  }

  async function handleMoveLeader(employeeId, leaderId) {
    try {
      const response = await fetch('/api/admin/leader-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, leader_id: leaderId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'No se pudo mover el líder');
      showAlert('Conexión actualizada', 'success');
      await Promise.all([loadEmployees(), loadLeaders()]);
    } catch (error) {
      console.error(error);
      showAlert(error.message || 'No se pudo mover el líder', 'error');
    }
  }

  // Función para abrir modal de edición con documento
  const handleEditEmployee = useCallback(async (employee) => {
    const employeeData = { ...employee };
    // Buscar documento del empleado
    const doc = documents.find(d => d.employee_id === employee.id);
    if (doc) {
      employeeData.document_number = doc.document_number;
      employeeData.docId = doc.id;
    }
    setEmpModal({ isOpen: true, mode: 'edit', data: employeeData });
  }, [documents]);

  // Merge employees with documents
  const employeesWithDocs = employees.map(emp => {
    const doc = documents.find(d => d.employee_id === emp.id);
    return {
      ...emp,
      document_number: doc?.document_number || null,
    };
  });

  // Filtered employees
  const filteredEmployees = employeesWithDocs.filter((e) =>
    e.personName?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    e.employeedID?.toString().includes(searchEmployee)
  );

  const handleSort = (table, key) => {
    setSortConfigs((current) => {
      const previous = current[table];
      return {
        ...current,
        [table]: {
          key,
          direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
        },
      };
    });
  };

  const sortedDepartments = sortRows(departments, sortConfigs.departments.key, sortConfigs.departments.direction);
  const sortedPositions = sortRows(positions, sortConfigs.positions.key, sortConfigs.positions.direction);
  const sortedEmployees = sortRows(filteredEmployees, sortConfigs.employees.key, sortConfigs.employees.direction);

  const sortIndicator = (table, key) => {
    const config = sortConfigs[table];
    if (config.key !== key) return '';
    return config.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <main className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <h1 className={styles.title}>Administración de colaboradores</h1>
            <p className={styles.description}>Gestiona departamentos, cargos y empleados.</p>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'departments', label: 'Departamentos', icon: faBuilding },
          { id: 'positions', label: 'Cargos', icon: faBriefcase },
          { id: 'employees', label: 'Empleados', icon: faUsers },
          { id: 'leadership', label: 'Organigrama', icon: faSitemap },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
          >
            <FontAwesomeIcon icon={t.icon} style={{ marginRight: '8px' }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Departments Tab */}
      {tab === 'departments' && (
        <div>
          <button
            className={styles.addButton}
            onClick={() => setDeptModal({ isOpen: true, mode: 'add', data: {} })}
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            Agregar Departamento
          </button>

          <TableScroll style={{ marginTop: '16px' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('departments', 'name')}>
                      Nombre <span>{sortIndicator('departments', 'name')}</span>
                    </button>
                  </th>
                  <th style={{ width: '180px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedDepartments.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.name}</strong>
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.editButton}
                        onClick={() => setDeptModal({ isOpen: true, mode: 'edit', data: d })}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className={styles.resetButton} onClick={() => handleDeleteDepartment(d.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      )}

      {/* Positions Tab */}
      {tab === 'positions' && (
        <div>
          <button
            className={styles.addButton}
            onClick={() => setPosModal({ isOpen: true, mode: 'add', data: {} })}
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            Agregar Cargo
          </button>

          <TableScroll style={{ marginTop: '16px' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('positions', 'name')}>
                      Nombre <span>{sortIndicator('positions', 'name')}</span>
                    </button>
                  </th>
                  <th style={{ width: '180px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.editButton}
                        onClick={() => setPosModal({ isOpen: true, mode: 'edit', data: p })}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className={styles.resetButton} onClick={() => handleDeletePosition(p.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      )}

      {/* Employees Tab */}
      {tab === 'employees' && (
        <div>
          <button
            className={styles.addButton}
            onClick={() => setEmpModal({ isOpen: true, mode: 'add', data: {} })}
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            Agregar Empleado
          </button>

          <div>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o ID..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className={styles.employeeSearch}
            />
          </div>

          <TableScroll>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('employees', 'personName')}>
                      Nombre <span>{sortIndicator('employees', 'personName')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('employees', 'employeedID')}>
                      Id empleado <span>{sortIndicator('employees', 'employeedID')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('employees', 'department_name')}>
                      Departamento <span>{sortIndicator('employees', 'department_name')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('employees', 'position_name')}>
                      Cargo <span>{sortIndicator('employees', 'position_name')}</span>
                    </button>
                  </th>
                  <th>Rol</th>
                  <th>Líder asignado</th>
                  <th>Documento</th>
                  <th style={{ width: '180px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.personName}</strong>
                    </td>
                    <td>{e.employeedID}</td>
                    <td>{e.department_name || 'Sin asignar'}</td>
                    <td>{e.position_name || 'Sin asignar'}</td>
                    <td>{e.role_name || 'Sin asignar'}</td>
                    <td>{e.leader_name || 'Sin líder'}</td>
                    <td>{e.document_number || 'Sin documento'}</td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditEmployee(e)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className={styles.resetButton} onClick={() => handleDeleteEmployee(e.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      )}

      {/* Leadership Map Tab */}
      {tab === 'leadership' && (
        <LeadershipMap
          employees={employeesWithDocs}
          leaders={leaders}
          onAssignEmployees={handleAssignEmployees}
          onRemoveEmployee={handleUnassignEmployee}
          onMoveLeader={handleMoveLeader}
          onEditEmployee={handleEditEmployee}
        />
      )}

      {/* Department Modal */}
      <Modal
        isOpen={deptModal.isOpen}
        title={deptModal.mode === 'add' ? 'Agregar Departamento' : 'Editar Departamento'}
        onClose={() => setDeptModal({ isOpen: false, mode: 'add', data: {} })}
      >
        <DepartmentForm
          mode={deptModal.mode}
          data={deptModal.data}
          onSubmit={handleSaveDepartment}
          onCancel={() => setDeptModal({ isOpen: false, mode: 'add', data: {} })}
        />
      </Modal>

      {/* Position Modal */}
      <Modal
        isOpen={posModal.isOpen}
        title={posModal.mode === 'add' ? 'Agregar Cargo' : 'Editar Cargo'}
        onClose={() => setPosModal({ isOpen: false, mode: 'add', data: {} })}
      >
        <PositionForm
          mode={posModal.mode}
          data={posModal.data}
          onSubmit={handleSavePosition}
          onCancel={() => setPosModal({ isOpen: false, mode: 'add', data: {} })}
        />
      </Modal>

      {/* Employee Modal */}
      <Modal
        isOpen={empModal.isOpen}
        title={empModal.mode === 'add' ? 'Agregar Empleado' : 'Editar Empleado'}
        onClose={() => setEmpModal({ isOpen: false, mode: 'add', data: {} })}
      >
        <EmployeeForm
          mode={empModal.mode}
          data={empModal.data}
          departments={departments}
          positions={positions}
          roles={roles}
          leaders={leaders}
          onSubmit={handleSaveEmployee}
          onCancel={() => setEmpModal({ isOpen: false, mode: 'add', data: {} })}
        />
      </Modal>
    </main>
  );
}

function LeadershipMap({ employees, leaders, onAssignEmployees, onRemoveEmployee, onMoveLeader, onEditEmployee }) {
  const [activeLeader, setActiveLeader] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [draggedEmployeeId, setDraggedEmployeeId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const leadersByEmployeeId = new Map(leaders.map((leader) => [leader.employee_id, leader]));
  const rootLeaders = leaders.filter((leader) => {
    const employee = employees.find((item) => item.id === leader.employee_id);
    return !employee?.leader_id;
  });
  const visibleLeaders = rootLeaders.length > 0 ? rootLeaders : leaders;
  const assignedEmployeeIds = new Set(employees.filter((employee) => employee.leader_id).map((employee) => employee.id));
  const withoutLeader = employees.filter((employee) => !assignedEmployeeIds.has(employee.id));
  const filteredWithoutLeader = withoutLeader.filter((employee) => {
    const text = `${employee.personName || ''} ${employee.last_name || ''}`.toLowerCase();
    return text.includes(unassignedSearch.toLowerCase());
  });
  const assignedCount = employees.length - withoutLeader.length;

  function openAssignment(leader) {
    const directReports = employees
      .filter((employee) => employee.leader_id === leader.id)
      .map((employee) => employee.id);
    setActiveLeader(leader);
    setSelectedEmployeeIds(directReports);
  }

  function toggleEmployee(employeeId) {
    setSelectedEmployeeIds((current) => current.includes(employeeId)
      ? current.filter((id) => id !== employeeId)
      : [...current, employeeId]);
  }

  function getDescendantEmployeeIds(leaderId) {
    const descendantIds = new Set();
    const pendingLeaderIds = [leaderId];

    while (pendingLeaderIds.length > 0) {
      const currentLeaderId = pendingLeaderIds.pop();
      employees
        .filter((employee) => employee.leader_id === currentLeaderId)
        .forEach((employee) => {
          if (!descendantIds.has(employee.id)) {
            descendantIds.add(employee.id);
            const childLeader = leadersByEmployeeId.get(employee.id);
            if (childLeader) pendingLeaderIds.push(childLeader.id);
          }
        });
    }

    return descendantIds;
  }

  function handleDragStart(event, item) {
    const employeeId = item.employee_id ?? item.id;
    setDraggedEmployeeId(employeeId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(employeeId));
  }

  function handleDragEnd() {
    setDraggedEmployeeId(null);
    setDropTargetId(null);
  }

  function handleDragOver(event, leader) {
    event.stopPropagation();
    if (!draggedEmployeeId || draggedEmployeeId === leader.employee_id) return;
    const descendants = getDescendantEmployeeIds(
      leadersByEmployeeId.get(draggedEmployeeId)?.id
    );
    if (descendants.has(leader.employee_id)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetId(leader.employee_id);
  }

  async function handleDrop(event, leader) {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedEmployeeId || draggedEmployeeId === leader.employee_id) return;
    const draggedLeader = leadersByEmployeeId.get(draggedEmployeeId);
    const descendants = getDescendantEmployeeIds(draggedLeader?.id);
    if (descendants.has(leader.employee_id)) return;
    await onMoveLeader(draggedEmployeeId, leader.id);
    handleDragEnd();
  }

  async function saveAssignments() {
    if (!activeLeader) return;
    setSaving(true);
    const currentDirectReports = employees
      .filter((employee) => employee.leader_id === activeLeader.id)
      .map((employee) => employee.id);
    const changedIds = [...new Set([...currentDirectReports, ...selectedEmployeeIds])];
    const assignments = changedIds.map((employeeId) => selectedEmployeeIds.includes(employeeId)
      ? employeeId
      : null);
    const requests = changedIds.map((employeeId, index) => fetch('/api/admin/leader-employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, leader_id: assignments[index] ? activeLeader.id : null }),
    }));
    try {
      const responses = await Promise.all(requests);
      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) {
        const payload = await failedResponse.json();
        throw new Error(payload?.error || 'No se pudieron guardar las asignaciones');
      }
      await onAssignEmployees(activeLeader.id, []);
      setActiveLeader(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.leadershipView}>
      <div className={styles.mapHeader}>
        <div>
          <span className={styles.mapEyebrow}>Estructura de equipos</span>
          <h2 className={styles.mapTitle}>Mapa de liderazgo</h2>
          <p className={styles.mapDescription}>Consulta la relación entre líderes y colaboradores asignados.</p>
        </div>
        <div className={styles.mapStats}>
          <div><strong>{leaders.length}</strong><span>Líderes</span></div>
          <div><strong>{assignedCount}</strong><span>Asignados</span></div>
          <div><strong>{withoutLeader.length}</strong><span>Sin líder</span></div>
        </div>
      </div>

      {visibleLeaders.length > 0 ? (
        <div className={styles.leadershipGrid}>
          {visibleLeaders.map((leader) => (
            <HierarchyNode
              key={leader.id}
              leader={leader}
              employees={employees}
              leadersByEmployeeId={leadersByEmployeeId}
              path={new Set()}
              onAddPeople={openAssignment}
              onRemoveEmployee={onRemoveEmployee}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dropTargetId={dropTargetId}
              isDropTarget={dropTargetId === leader.employee_id}
              onSelectEmployee={setSelectedEmployee}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyMap}>No hay líderes registrados con `role_id = 4`.</div>
      )}

      {withoutLeader.length > 0 && (
        <div className={styles.unassignedPanel}>
          <div className={styles.unassignedHeading}>
            <div>
              <span className={styles.mapEyebrow}>Pendientes de asignación</span>
              <h3>Colaboradores sin líder</h3>
            </div>
            <span className={styles.unassignedCount}>{withoutLeader.length}</span>
          </div>
          <input
            type="search"
            className={styles.assignmentSearch}
            value={unassignedSearch}
            onChange={(event) => setUnassignedSearch(event.target.value)}
            placeholder="Buscar colaborador por nombre o apellido"
            aria-label="Buscar colaborador pendiente por nombre o apellido"
          />
          <div className={styles.unassignedList}>
            {filteredWithoutLeader.map((employee) => (
              <div className={styles.unassignedItem} key={employee.id}>
                <button
                  type="button"
                  className={styles.collaboratorAvatarButton}
                  onClick={() => setSelectedEmployee(employee)}
                  aria-label={`Ver información de ${employee.personName}`}
                  title={`Ver información de ${employee.personName}`}
                >
                  <span className={styles.collaboratorAvatar}>{employee.personName?.charAt(0) || 'C'}</span>
                </button>
                <div><strong>{employee.personName}</strong><span>{employee.department_name || 'Sin departamento'}</span></div>
                <button
                  type="button"
                  className={styles.dragHandle}
                  draggable
                  onDragStart={(event) => handleDragStart(event, employee)}
                  onDragEnd={handleDragEnd}
                  aria-label={`Arrastrar a ${employee.personName}`}
                  title="Arrastrar para asignar"
                >
                  <FontAwesomeIcon icon={faGripVertical} />
                </button>
              </div>
            ))}
            {filteredWithoutLeader.length === 0 && (
              <div className={styles.emptyNode}>No hay colaboradores que coincidan con la búsqueda.</div>
            )}
          </div>
        </div>
      )}
      <Modal
        isOpen={Boolean(selectedEmployee)}
        title={selectedEmployee ? selectedEmployee.personName : 'Información del colaborador'}
        onClose={() => setSelectedEmployee(null)}
      >
        {selectedEmployee && (
          <div className={styles.employeeDetailsPanel}>
            <div className={styles.employeeDetailsHeader}>
              <div className={styles.employeeDetailsAvatar}>{selectedEmployee.personName?.charAt(0) || 'C'}</div>
              <div>
                <strong>{selectedEmployee.personName}</strong>
                <small>{selectedEmployee.position_name || 'Colaborador'} · {selectedEmployee.department_name || 'Sin departamento'}</small>
              </div>
            </div>
            <div className={styles.employeeDetailsGrid}>
              <div>
                <span className={styles.detailLabel}>Cargo</span>
                <strong>{selectedEmployee.position_name || 'Sin cargo'}</strong>
              </div>
              <div>
                <span className={styles.detailLabel}>Departamento</span>
                <strong>{selectedEmployee.department_name || 'Sin departamento'}</strong>
              </div>
              <div>
                <span className={styles.detailLabel}>Rol</span>
                <strong>{selectedEmployee.role_name || 'Sin rol'}</strong>
              </div>
              <div>
                <span className={styles.detailLabel}>Líder</span>
                <strong>{selectedEmployee.leader_name || 'Sin líder'}</strong>
              </div>
              {selectedEmployee.document_number && (
                <div>
                  <span className={styles.detailLabel}>Documento</span>
                  <strong>{selectedEmployee.document_number}</strong>
                </div>
              )}
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.formSubmit}
                onClick={() => {
                  const employee = selectedEmployee;
                  setSelectedEmployee(null);
                  onEditEmployee(employee);
                }}
              >
                <FontAwesomeIcon icon={faEdit} />
                Editar
              </button>
              <button type="button" className={styles.formCancel} onClick={() => setSelectedEmployee(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={Boolean(activeLeader)}
        title={activeLeader ? `Personas a cargo de ${activeLeader.personName}` : 'Asignar personas'}
        onClose={() => setActiveLeader(null)}
      >
        <p className={styles.assignmentHint}>Marca las personas que deben depender directamente de este líder. Desmarcar una persona la deja sin líder.</p>
        <input
          type="text"
          className={styles.assignmentSearch}
          value={employeeSearch}
          onChange={(event) => setEmployeeSearch(event.target.value)}
          placeholder="Buscar colaborador por nombre o apellido"
          aria-label="Buscar colaborador por nombre o apellido"
        />
        <div className={styles.assignmentList}>
          {employees
            .filter((employee) => employee.id !== activeLeader?.employee_id)
            .filter((employee) => {
              const text = `${employee.personName || ''} ${employee.last_name || ''}`.toLowerCase();
              return text.includes(employeeSearch.toLowerCase());
            })
            .map((employee) => (
              <label className={styles.assignmentOption} key={employee.id}>
                <input
                  type="checkbox"
                  checked={selectedEmployeeIds.includes(employee.id)}
                  onChange={() => toggleEmployee(employee.id)}
                />
                <span>
                  <strong>{employee.personName}</strong>
                  <small>{employee.department_name || 'Sin departamento'} · {employee.position_name || 'Sin cargo'}</small>
                </span>
              </label>
            ))}
        </div>
        <div className={styles.formActions}>
          <button type="button" className={styles.formCancel} onClick={() => setActiveLeader(null)}>Cancelar</button>
          <button type="button" className={styles.formSubmit} onClick={saveAssignments} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar asignaciones'}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function HierarchyNode({
  leader,
  employees,
  leadersByEmployeeId,
  path,
  onAddPeople,
  onRemoveEmployee,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dropTargetId,
  isDropTarget,
  onSelectEmployee,
}) {
  const nextPath = new Set(path);
  nextPath.add(leader.id);
  const directReports = employees.filter((employee) => employee.leader_id === leader.id);
  const leaderEmployee = employees.find((employee) => employee.id === leader.employee_id) || leader;

  return (
    <article
      className={`${styles.leaderCard} ${isDropTarget ? styles.dropTarget : ''}`}
      onDragOver={(event) => onDragOver(event, leader)}
      onDrop={(event) => void onDrop(event, leader)}
    >
      <div className={styles.nodeActions}>
        <button
          type="button"
          className={styles.dragHandle}
          draggable
          onDragStart={(event) => onDragStart(event, leader)}
          onDragEnd={onDragEnd}
          aria-label={`Arrastrar a ${leader.personName}`}
          title="Arrastrar para conectar"
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </button>
        {path.size > 0 && (
          <button
            type="button"
            className={styles.removeAssignmentButton}
            onClick={() => onRemoveEmployee(leader.employee_id)}
            aria-label="Quitar de este líder"
            title="Quitar de este líder"
          >
            <FontAwesomeIcon icon={faUserMinus} className={styles.smallIcon} />
          </button>
        )}
        <button
          type="button"
          className={styles.addPeopleButton}
          onClick={() => onAddPeople(leader)}
          aria-label="Agregar personas"
          title="Agregar personas"
        >
          <FontAwesomeIcon icon={faUserPlus} className={styles.smallIcon} />
        </button>
      </div>
      <div
        className={styles.leaderNode}
      >
        <button
          type="button"
          className={styles.leaderAvatarButton}
          onClick={() => onSelectEmployee(leaderEmployee)}
          aria-label={`Ver información de ${leader.personName}`}
          title={`Ver información de ${leader.personName}`}
        >
          <span className={styles.leaderAvatar}>{leader.personName?.charAt(0) || 'L'}</span>
        </button>
        <div>
          <span className={styles.nodeKicker}>Líder aprobador</span>
          <h3>{leader.personName}</h3>
          <span className={styles.nodeDepartment}>{leader.department_name || 'Sin departamento'}</span>
        </div>
        <span className={styles.memberCount}>{directReports.length}</span>
      </div>
      <div className={styles.connector} />
      <div className={styles.collaboratorNodes}>
        {directReports.length > 0 ? directReports.map((employee) => {
          const childLeader = leadersByEmployeeId.get(employee.id);
          if (childLeader && !nextPath.has(childLeader.id)) {
            return (
              <div className={styles.nestedLeader} key={employee.id}>
                <HierarchyNode
                  leader={childLeader}
                  employees={employees}
                  leadersByEmployeeId={leadersByEmployeeId}
                  path={nextPath}
                  onAddPeople={onAddPeople}
                  onRemoveEmployee={onRemoveEmployee}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  dropTargetId={dropTargetId}
                  isDropTarget={dropTargetId === childLeader.employee_id}
                  onSelectEmployee={onSelectEmployee}
                />
              </div>
            );
          }

          return (
            <div className={styles.collaboratorNode} key={employee.id}>
              <button
                type="button"
                className={styles.collaboratorAvatarButton}
                onClick={() => onSelectEmployee(employee)}
                aria-label={`Ver información de ${employee.personName}`}
                title={`Ver información de ${employee.personName}`}
              >
                <span className={styles.collaboratorAvatar}>{employee.personName?.charAt(0) || 'C'}</span>
              </button>
              <div className={styles.collaboratorInfo}>
                <strong>{employee.personName}</strong>
                <span>{employee.position_name || 'Colaborador'}</span>
                <span className={styles.nodeDepartment}>{employee.department_name || 'Sin departamento'}</span>
              </div>
              <div className={styles.collaboratorActions}>
                <button
                  type="button"
                  className={styles.dragHandle}
                  draggable
                  onDragStart={(event) => onDragStart(event, employee)}
                  onDragEnd={onDragEnd}
                  aria-label={`Arrastrar a ${employee.personName}`}
                  title="Arrastrar para conectar"
                >
                  <FontAwesomeIcon icon={faGripVertical} />
                </button>
                <button
                  type="button"
                  className={styles.removeAssignmentButton}
                  onClick={() => onRemoveEmployee(employee.id)}
                  aria-label="Quitar asignación"
                  title="Quitar asignación"
                >
                  <FontAwesomeIcon icon={faTrash} className={styles.smallIcon} />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className={styles.emptyNode}>Sin colaboradores asignados</div>
        )}
      </div>
    </article>
  );
}

function DepartmentForm({ mode, data, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ name: data.name || '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Nombre" required>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Gerencia, Ventas, TI..."
          style={errors.name ? { borderColor: '#b91c1c' } : {}}
        />
        {errors.name && <span style={{ color: '#b91c1c', fontSize: '12px' }}>{errors.name}</span>}
      </FormField>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          type="submit"
          style={{
            padding: '8px 18px',
            background: '#36BBA7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {mode === 'add' ? 'Crear' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 18px',
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PositionForm({ mode, data, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ name: data.name || '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Nombre" required>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Gerente, Analista..."
          style={errors.name ? { borderColor: '#b91c1c' } : {}}
        />
        {errors.name && <span style={{ color: '#b91c1c', fontSize: '12px' }}>{errors.name}</span>}
      </FormField>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          type="submit"
          style={{
            padding: '8px 18px',
            background: '#36BBA7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {mode === 'add' ? 'Crear' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 18px',
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function EmployeeForm({ mode, data, departments, positions, roles, leaders, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employeedID: data.employeedID || '',
    personName: data.personName || '',
    department_id: data.department_id || '',
    position_id: data.position_id || '',
    role_id: data.role_id || '',
    leader_id: data.leader_id || '',
    active: data.active !== false,
    document_number: data.document_number || '',
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.employeedID.trim()) newErrors.employeedID = 'El ID de empleado es requerido';
    if (!formData.personName.trim()) newErrors.personName = 'El nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        position_id: formData.position_id ? parseInt(formData.position_id) : null,
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
        leader_id: formData.leader_id ? parseInt(formData.leader_id) : null,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="ID Empleado" required>
        <Input
          value={formData.employeedID}
          onChange={(e) => setFormData({ ...formData, employeedID: e.target.value })}
          placeholder="Ej: 123, 456..."
          style={errors.employeedID ? { borderColor: '#b91c1c' } : {}}
        />
        {errors.employeedID && <span style={{ color: '#b91c1c', fontSize: '12px' }}>{errors.employeedID}</span>}
      </FormField>

      <FormField label="Nombre Completo" required>
        <Input
          value={formData.personName}
          onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
          placeholder="Nombre completo..."
          style={errors.personName ? { borderColor: '#b91c1c' } : {}}
        />
        {errors.personName && <span style={{ color: '#b91c1c', fontSize: '12px' }}>{errors.personName}</span>}
      </FormField>

      <FormField label="Departamento">
        <Select
          value={formData.department_id}
          onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
        >
          <option value="">-- Sin asignar --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Cargo">
        <Select
          value={formData.position_id}
          onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
        >
          <option value="">-- Sin asignar --</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Rol">
        <Select
          value={formData.role_id}
          onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
        >
          <option value="">-- Sin asignar --</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.description || role.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Líder">
        <Select
          value={formData.leader_id}
          onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
        >
          <option value="">-- Sin líder --</option>
          {leaders
            .filter((leader) => leader.employee_id !== data.id)
            .map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.personName} ({leader.employeedID})
              </option>
            ))}
        </Select>
      </FormField>

      <FormField label="Número de Documento">
        <Input
          value={formData.document_number}
          onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
          placeholder="Ej: DOC-12345, 987654321..."
        />
      </FormField>

      <FormField label="">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className={styles.activeCheckbox}
          />
          <span style={{ fontSize: '14px', color: '#1e293b' }}>Empleado Activo</span>
        </label>
      </FormField>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          type="submit"
          style={{
            padding: '8px 18px',
            background: '#36BBA7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {mode === 'add' ? 'Crear' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 18px',
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
