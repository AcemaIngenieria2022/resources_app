"use client";

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faSearch, 
  faFilter, 
  faEdit, 
  faTrashAlt,
  faUserPlus,
  faCheckCircle,
  faTimesCircle,
  faPauseCircle,
  faUser,
  faEnvelope,
  faIdCard,
  faCalendarAlt,
  faSave,
  faTimes,
  faSpinner,
  faUserCog,
  faKey,
  faUserShield,
  faUserTie,
  faUserGraduate,
  faUserClock,
  faRefresh,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';

// Constants
const roleOptions = ['admin', 'hr', 'supervisor', 'approver', 'user'];
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'disabled', label: 'Desactivado' },
];

// Role configuration
const roleConfig = {
  admin: { icon: faUserShield, color: '#dc2626', label: 'Administrador' },
  hr: { icon: faUserTie, color: '#2563eb', label: 'RR.HH.' },
  supervisor: { icon: faUserGraduate, color: '#7c3aed', label: 'Supervisor' },
  approver: { icon: faUserClock, color: '#059669', label: 'Aprobador' },
  user: { icon: faUser, color: '#6b7280', label: 'Usuario' },
};

// Status configuration
const statusConfig = {
  active: { icon: faCheckCircle, color: '#059669', label: 'Activo' },
  suspended: { icon: faPauseCircle, color: '#d97706', label: 'Suspendido' },
  disabled: { icon: faTimesCircle, color: '#dc2626', label: 'Desactivado' },
};

// Utility functions
const normalizeStatus = (value) => {
  if (value === true || value === 1 || value === '1') return 'active';
  if (value === false || value === 0 || value === '0') return 'disabled';
  if (!value) return 'active';

  const normalized = String(value).toLowerCase();
  if (normalized === 'inactive') return 'disabled';
  if (['active', 'suspended', 'disabled'].includes(normalized)) return normalized;
  return 'active';
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getUserStatus = (user) => normalizeStatus(user?.status ?? user?.active);

const buildSelectOptions = (options, selectedValue) =>
  options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value || option)}" ${
          (option.value || option) === selectedValue ? 'selected' : ''
        }>${escapeHtml(option.label || String(option))}</option>`
    )
    .join('');

const bindPasswordToggle = (inputId, buttonId) => {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  if (!input || !button) return;

  button.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    button.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
    button.setAttribute('title', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
};

// SweetAlert Form
const showUserForm = async ({ mode, user = {} }) => {
  const email = escapeHtml(user.email || '');
  const firstName = escapeHtml(user.first_name || '');
  const lastName = escapeHtml(user.last_name || '');
  const role = user.role || 'user';
  const status = normalizeStatus((user.status ?? user.active) || 'active');

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:1px 0;">
      <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
        <i class="fas fa-envelope" style="color:#94a3b8;"></i>
        <input id="swal-user-email" name="new-user-email" autocomplete="off" class="swal2-input" placeholder="Email" value="${email}" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
      </div>
      <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
        <i class="fas fa-user" style="color:#94a3b8;"></i>
        <input id="swal-user-first-name" name="new-user-first-name" autocomplete="off" class="swal2-input" placeholder="Nombre" value="${firstName}" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
      </div>
      <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
        <i class="fas fa-user" style="color:#94a3b8;"></i>
        <input id="swal-user-last-name" name="new-user-last-name" autocomplete="off" class="swal2-input" placeholder="Apellido" value="${lastName}" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
      </div>
      <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
        <i class="fas fa-user-cog" style="color:#94a3b8;"></i>
        <select id="swal-user-role" class="swal2-select" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">${buildSelectOptions(roleOptions, role)}</select>
      </div>
      <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
        <i class="fas fa-check-circle" style="color:#94a3b8;"></i>
        <select id="swal-user-status" class="swal2-select" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">${buildSelectOptions(statusOptions, status)}</select>
      </div>
      ${
        mode === 'create'
          ? `
        <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
          <i class="fas fa-lock" style="color:#94a3b8;"></i>
          <input id="swal-user-password" type="password" class="swal2-input" placeholder="Contraseña" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
          <button type="button" id="toggle-user-password" class="password-toggle" aria-label="Mostrar contraseña" title="Mostrar contraseña">&#128065;</button>
        </div>
        <div style="display:flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 6px;border-radius:7px;">
          <i class="fas fa-lock" style="color:#94a3b8;"></i>
          <input id="swal-user-password-repeat" type="password" class="swal2-input" placeholder="Repetir contraseña" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
          <button type="button" id="toggle-user-password-repeat" class="password-toggle" aria-label="Mostrar contraseña" title="Mostrar contraseña">&#128065;</button>
        </div>
        `
          : ''
      }
    </div>
  `;

  const { value } = await Swal.fire({
    title: mode === 'create' ? 'Agregar usuario' : `Editar usuario ${email}`,
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: mode === 'create' ? 'Crear' : 'Guardar',
    cancelButtonText: 'Cancelar',
    width: '480px',
    customClass: {
      confirmButton: 'swal2-confirm',
      cancelButton: 'swal2-cancel',
      popup: 'swal2-popup-custom',
      container: 'user-modal-container'
    },
    didOpen: () => {
      if (mode === 'create') {
        const emailInput = document.getElementById('swal-user-email');
        if (emailInput) emailInput.value = '';
        bindPasswordToggle('swal-user-password', 'toggle-user-password');
        bindPasswordToggle('swal-user-password-repeat', 'toggle-user-password-repeat');
      }
    },
    preConfirm: () => {
      const emailValue = document.getElementById('swal-user-email')?.value.trim();
      const firstNameValue = document.getElementById('swal-user-first-name')?.value.trim();
      const lastNameValue = document.getElementById('swal-user-last-name')?.value.trim();
      const roleValue = document.getElementById('swal-user-role')?.value;
      const statusValue = document.getElementById('swal-user-status')?.value;

      if (!emailValue || !firstNameValue || !lastNameValue) {
        Swal.showValidationMessage('Completa email, nombre y apellido');
        return null;
      }

      if (mode === 'create') {
        const passwordValue = document.getElementById('swal-user-password')?.value || '';
        const repeatValue = document.getElementById('swal-user-password-repeat')?.value || '';

        if (passwordValue.length < 6) {
          Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
          return null;
        }

        if (passwordValue !== repeatValue) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return null;
        }

        return {
          email: emailValue,
          firstName: firstNameValue,
          lastName: lastNameValue,
          role: roleValue,
          status: statusValue,
          password: passwordValue,
        };
      }

      return {
        email: emailValue,
        firstName: firstNameValue,
        lastName: lastNameValue,
        role: roleValue,
        status: statusValue,
      };
    },
  });

  return value;
};

// Component
export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchReadOnly, setSearchReadOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // API Functions
  const fetchUsers = async ({ search: searchValue, role: roleValue } = {}) => {
    setLoading(true);
    setError('');
    setMessage('');

    const params = new URLSearchParams();
    params.set('limit', '200');
    const finalSearch = searchValue !== undefined ? searchValue : search;
    const finalRole = roleValue !== undefined ? roleValue : selectedRole;

    if (finalSearch) params.set('search', finalSearch);
    if (finalRole) params.set('role', finalRole);

    try {
      const response = await fetch(`/api/users?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo cargar la lista de usuarios');
      }

      setUsers(payload.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers
  const handleCreateUser = async (formData) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          status: formData.status,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.meta?.message || 'No se pudo crear el usuario');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Usuario creado',
        text: 'El usuario se ha creado correctamente.',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });

      setSearch('');
      setSelectedRole('');
      await fetchUsers({ search: '', role: '' });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (userId, formData) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          status: formData.status,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo actualizar el usuario');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Usuario actualizado',
        text: 'Los datos del usuario se han guardado correctamente.',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });

      await fetchUsers();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleOpenCreate = async () => {
    setSearch('');
    try {
      const values = await showUserForm({ mode: 'create' });
      if (values) {
        await handleCreateUser(values);
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo crear el usuario',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    }
  };

  const handleEdit = async (user) => {
    try {
      const values = await showUserForm({ mode: 'edit', user });
      if (values) {
        await handleSave(user.id, values);
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo editar el usuario',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const currentStatus = getUserStatus(user);
      const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo cambiar el estado del usuario');
      }

      setMessage(`Usuario ${nextStatus === 'active' ? 'activado' : 'desactivado'} correctamente`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cambiar el estado');
    }
  };

  const handleResetPassword = async (user) => {
    try {
      const { value: values } = await Swal.fire({
        title: `Restablecer contraseña`,
        html: `
          <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0;">
            <p style="text-align:center;color:#64748b;font-size:13px;">${user.email}</p>
            <div style="display:flex;align-items:center;gap:6px;background:#f8fafc;padding:5px 8px;border-radius:8px;">
              <i class="fas fa-lock" style="color:#94a3b8;"></i>
              <input id="swal-new-password" type="password" class="swal2-input" placeholder="Nueva contraseña" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
              <button type="button" id="toggle-new-password" class="password-toggle" aria-label="Mostrar contraseña" title="Mostrar contraseña">&#128065;</button>
            </div>
            <div style="display:flex;align-items:center;gap:6px;background:#f8fafc;padding:5px 8px;border-radius:8px;">
              <i class="fas fa-lock" style="color:#94a3b8;"></i>
              <input id="swal-repeat-password" type="password" class="swal2-input" placeholder="Repetir contraseña" style="flex:1;border:none;background:transparent;padding:4px 0;margin:0;">
              <button type="button" id="toggle-repeat-password" class="password-toggle" aria-label="Mostrar contraseña" title="Mostrar contraseña">&#128065;</button>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        width: '480px',
        customClass: {
          container: 'user-modal-container',
        },
        didOpen: () => {
          bindPasswordToggle('swal-new-password', 'toggle-new-password');
          bindPasswordToggle('swal-repeat-password', 'toggle-repeat-password');
        },
        preConfirm: () => {
          const newPassword = document.getElementById('swal-new-password')?.value || '';
          const repeatPassword = document.getElementById('swal-repeat-password')?.value || '';

          if (newPassword.length < 6) {
            Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
            return null;
          }

          if (newPassword !== repeatPassword) {
            Swal.showValidationMessage('Las contraseñas deben coincidir');
            return null;
          }

          return { newPassword };
        },
      });

      if (!values) return;

      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: values.newPassword }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo restablecer la contraseña');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'La contraseña se ha restablecido correctamente.',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });

      await fetchUsers();
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al restablecer la contraseña',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    }
  };

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole]);

  return (
    <main className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <h1 className={styles.title}>Gestión de usuarios</h1>
            <p className={styles.description}>
              Administra cuentas, roles y acceso al sistema desde este panel.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.addButton} onClick={handleOpenCreate}>
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Agregar usuario</span>
          </button>
          <button className={styles.refreshButton} onClick={() => fetchUsers()}>
            <FontAwesomeIcon icon={faRefresh} className={loading ? styles.spinning : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.actions}>
        <div className={styles.searchBox}>
          <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
          <input
            type="search"
            id="records-filter"
            name="records-filter"
            autoComplete="off"
            readOnly={searchReadOnly}
            onFocus={() => setSearchReadOnly(false)}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por email, nombre o apellido..."
            className={styles.searchInput}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className={styles.filterBox}>
          <FontAwesomeIcon icon={faFilter} className={styles.filterIcon} />
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todos los roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleConfig[role]?.label || role}
              </option>
            ))}
          </select>
          {selectedRole && (
            <button className={styles.clearFilter} onClick={() => setSelectedRole('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className={styles.error}>
          <FontAwesomeIcon icon={faTimesCircle} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className={styles.success}>
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>{message}</span>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableScrollContainer}>
          <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              <th className={styles.actionsHeader}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className={styles.loading}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Cargando usuarios...</span>
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => {
                const status = getUserStatus(user);
                const role = roleConfig[user.role] || roleConfig.user;
                const statusInfo = statusConfig[status] || statusConfig.active;

                return (
                  <tr key={user.id} className={styles[`${status}Row`] || styles.activeRow}>
                    <td className={styles.idCell}>#{user.id}</td>
                    <td className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'Sin nombre'}
                        </div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{user.email}</td>
                    <td>
                      <span
                        className={styles.roleBadge}
                        style={{
                          backgroundColor: `${role.color}15`,
                          color: role.color,
                          borderColor: `${role.color}30`,
                        }}
                      >
                        <FontAwesomeIcon icon={role.icon} />
                        {role.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${styles[status] || styles.active}`}
                        style={{
                          backgroundColor: `${statusInfo.color}15`,
                          color: statusInfo.color,
                          borderColor: `${statusInfo.color}30`,
                        }}
                      >
                        <FontAwesomeIcon icon={statusInfo.icon} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => handleEdit(user)}
                        title="Editar usuario"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        type="button"
                        className={styles.resetButton}
                        onClick={() => handleResetPassword(user)}
                        title="Restablecer contraseña"
                      >
                        <FontAwesomeIcon icon={faKey} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${
                          status === 'active' ? styles.deactivate : styles.activate
                        }`}
                        onClick={() => handleToggleStatus(user)}
                        title={status === 'active' ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        <FontAwesomeIcon
                          icon={status === 'active' ? faTimesCircle : faCheckCircle}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className={styles.empty}>
                  <FontAwesomeIcon icon={faUsers} />
                  <span>No hay usuarios para mostrar</span>
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}