"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faCheckCircle,
  faTimesCircle,
  faTrash,
  faCheck,
  faTimes,
  faEye,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';
import { useAuthContext } from '@/context/AuthContext';

// Modal reutilizable para mostrar detalles y contenido contextual de una novedad.
const Modal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '16px 18px',
          maxWidth: '900px',
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

// Alertas visuales para feedback inmediato del usuario sobre acciones de aprobación, rechazo o carga.
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

// Modal de detalle de una novedad: muestra la información completa y los documentos asociados.
const DetailModal = ({ isOpen, data, onClose }) => {
  if (!data) return null;

  return (
    <Modal isOpen={isOpen} title="Detalles de la Novedad" onClose={onClose}>
      <div className={styles.detailLayout}>
        <div className={styles.detailInfo}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Nombre:</span>
              <span className={styles.detailValue}>{data.form_full_name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email:</span>
              <span className={styles.detailValue}>{data.form_email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Identificación:</span>
              <span className={styles.detailValue}>{data.identification_id}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cargo:</span>
              <span className={styles.detailValue}>{data.form_position}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Teléfono:</span>
              <span className={styles.detailValue}>{data.form_phone}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Supervisor:</span>
              <span className={styles.detailValue}>{data.leader_name || data.direct_supervisor || 'Sin líder'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tipo de Novedad:</span>
              <span className={styles.detailValue}>{data.leave_class}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Motivo:</span>
              <span className={styles.detailValue}>{data.reason || 'Sin motivo registrado'}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Datos del permiso solicitado:</span>
              <span className={styles.detailValue}>
                {data.permission_type === 'hours' ? 'Permiso por horas' : 'Permiso por días'}
              </span>
            </div>

            {data.permission_type === 'days' ? (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Desde:</span>
                  <span className={styles.detailValue}>{formatDate(data.start_date)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hasta:</span>
                  <span className={styles.detailValue}>{formatDate(data.end_date)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total días:</span>
                  <span className={styles.detailValue}>{data.total_days ?? 'Sin información'}</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fecha:</span>
                  <span className={styles.detailValue}>{formatDate(data.permission_date)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hora inicio:</span>
                  <span className={styles.detailValue}>{formatTime(data.start_time)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hora fin:</span>
                  <span className={styles.detailValue}>{formatTime(data.end_time)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total horas:</span>
                  <span className={styles.detailValue}>{data.total_hours ?? 'Sin información'}</span>
                </div>
              </>
            )}

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Estado actual:</span>
              <span className={`${styles.detailValue} ${styles[`status-${data.status.toLowerCase()}`]}`}>
                {data.state_name || data.status}
              </span>
            </div>
            {data.rejected_by_name && <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Rechazado por:</span>
              <span className={styles.detailValue}>{getRejectionDisplay(data)}</span>
            </div>}
            {data.rejection_observation && <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Observación del rechazo:</span>
              <span className={styles.detailValue}>{data.rejection_observation}</span>
            </div>}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fecha de Registro:</span>
              <span className={styles.detailValue}>
                {new Date(data.created_at).toLocaleDateString('es-CO')}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Estado pendiente:</span>
              <span className={styles.detailValue}>{getPendingState(data.state_code)}</span>
            </div>
          </div>
        </div>

        {data.attachment_url ? (
          <div className={styles.detailPreview}>
            <div className={styles.attachmentPreview}>
              <div className={styles.attachmentHeader}>
                <span className={styles.detailLabel}>Documento soporte:</span>
              </div>
              {(/\.(jpg|jpeg|png)$/i).test(data.attachment_url) ? (
                <img
                  src={`/api/leave-requests/attachment/${encodeURIComponent(data.attachment_url)}`}
                  alt="Documento soporte"
                  className={styles.attachmentImage}
                />
              ) : (
                <iframe
                  title="Vista previa del documento soporte"
                  src={`/api/leave-requests/attachment/${encodeURIComponent(data.attachment_url)}`}
                  className={styles.attachmentFrame}
                />
              )}
              <div className={styles.attachmentActions}>
                <a
                  href={`/api/leave-requests/attachment/${encodeURIComponent(data.attachment_url)}?download=1`}
                  className={styles.downloadButton}
                  download
                >
                  Descargar
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.detailPreview}>
            <div className={styles.attachmentPreview}>
              <div className={styles.attachmentHeader}>
                <span className={styles.detailLabel}>Documento soporte:</span>
              </div>
              <p className={styles.noAttachmentMessage}>No hay documento adjunto.</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Devuelve el texto del siguiente paso pendiente según el estado actual de la novedad.
function getPendingState(stateCode) {
  const states = {
    created: 'Pendiente de aprobación del líder',
    leader_pending: 'Pendiente de aprobación del líder',
    leader_approved: 'Pendiente de revisión de RR. HH.',
    hr_pending: 'Pendiente de revisión de RR. HH.',
  };
  return states[stateCode] || 'Sin estado pendiente';
}

function formatTraceDate(value) {
  if (!value) return 'Pendiente';
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return 'Sin información';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin información';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return 'Sin información';
  return value;
}

// Formatea la leyenda de rechazos para distinguir una cancelación automática por vencimiento de un rechazo manual.
function getRejectionDisplay(request) {
  if (request.rejected_by_name === 'Sistema' || request.rejected_by_role === 'Sistema') {
    return 'Rechazado automáticamente por tiempo excedido';
  }

  return request.rejected_by_name || 'No disponible';
}

// Construye la trazabilidad visual de la novedad con sus etapas de líder, RR. HH., finalización y vencimiento.
function RequestTimeline({ request }) {
  const currentState = request.state_code || 'created';
  const hasLeaderApproval = Boolean(request.leader_approved_at);
  const hasHrApproval = Boolean(request.completed_at);
  const hasRejected = Boolean(request.rejected_at);
  const isRejectedFlow = ['leader_rejected', 'hr_rejected'].includes(currentState);
  const isExpired = currentState === 'expired';
  const isCancelled = currentState === 'cancelled';
  const isLeaderRejected = currentState === 'leader_rejected';
  const isAutoRejected = request.rejected_by_name === 'Sistema' || request.rejected_by_role === 'Sistema';
  const hrStageDate = isLeaderRejected ? null : request.completed_at || request.rejected_at;
  const hrStageActor = isLeaderRejected ? null : request.completed_by_name || request.rejected_by_name;

  const events = [
    {
      label: 'Creada',
      date: request.created_at,
      actor: request.form_full_name,
      tone: 'created',
      active: true,
      current: ['created', 'leader_pending'].includes(currentState),
    },
    {
      label: isExpired
        ? 'Estado líder'
        : (currentState === 'leader_rejected'
          ? (isAutoRejected ? 'Rechazado automáticamente por tiempo excedido' : 'Rechazado por líder')
          : 'Estado líder'),
      date: request.leader_approved_at || request.rejected_at,
      actor: request.leader_approved_by_name || request.rejected_by_name,
      tone: currentState === 'leader_rejected' ? 'rejected' : 'approved',
      active: hasLeaderApproval || currentState === 'leader_rejected' || currentState === 'expired' || ['hr_pending', 'completed', 'hr_rejected'].includes(currentState),
      current: currentState === 'hr_pending' || currentState === 'leader_rejected',
    },
    ...(isLeaderRejected
      ? []
      : [
          {
            label: isExpired
              ? 'Estado RRHH'
              : (currentState === 'hr_rejected'
                ? (isAutoRejected ? 'Rechazado automáticamente por tiempo excedido' : 'Rechazado por RR. HH.')
                : 'Estado RRHH'),
            date: hrStageDate,
            actor: hrStageActor,
            tone: currentState === 'hr_rejected' ? 'rejected' : 'hr',
            active: hasHrApproval || currentState === 'hr_rejected' || currentState === 'completed' || currentState === 'expired',
            current: currentState === 'completed' || currentState === 'hr_rejected',
          },
        ]),
    {
      label: isExpired ? 'Vencida' : isCancelled ? 'Cancelado' : 'Finalizada',
      date: isCancelled ? (request.rejected_at || request.completed_at) : (request.completed_at || request.rejected_at),
      actor: isCancelled ? (request.rejected_by_name || request.completed_by_name) : (request.completed_by_name || request.rejected_by_name),
      tone: isCancelled ? 'cancelled' : (isExpired ? 'expired' : (isRejectedFlow ? 'rejected' : 'completed')),
      active: hasHrApproval || hasRejected || currentState === 'completed' || currentState === 'expired' || currentState === 'cancelled' || isRejectedFlow,
      current: currentState === 'completed' || currentState === 'expired' || currentState === 'cancelled' || isRejectedFlow,
    },
  ];

  return (
    <div className={styles.timeline}>
      <span className={styles.timelineTitle}>Trazabilidad</span>
      <div className={styles.timelineEvents}>
        {events.map((event) => {
          const shouldHideTraceDate = isExpired && ['approved', 'hr'].includes(event.tone);

          return (
            <div
              className={`${styles.timelineEvent} ${event.active ? styles[`timeline${event.tone}`] : styles.timelinePending} ${event.current ? styles.timelineCurrent : ''}`}
              key={`${event.label}-${event.date || 'pending'}`}
            >
              <span className={styles.timelineDot} />
              <div>
                <strong>{event.label}</strong>
                {!shouldHideTraceDate && <span>{formatTraceDate(event.date)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pantalla principal de novedades.
// Muestra la lista, estadísticas, detalle, trazabilidad y acciones de revisión de solicitudes.
export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState(null);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const { user } = useAuthContext();
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[.\s]/g, '');
  const reviewRole = ['hr', 'rrhh'].includes(normalizedRole)
    ? 'hr'
    : ['approver', 'leader'].includes(normalizedRole)
      ? 'leader'
      : normalizedRole;

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
  }, []);

  // Carga la lista de novedades para mostrarla en la tabla principal.
  const loadLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (reviewRole === 'leader') {
        params.set('role', 'leader');
        params.set('userId', String(user?.id || ''));
      }
      const url = `/api/admin/leave-requests?${params.toString()}`;
      
      const res = await fetch(url);
      const payload = await res.json();
      setLeaveRequests(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar novedades', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reviewRole, user, showAlert]);

  // Carga los contadores de estadísticas para el panel superior de la pantalla.
  const loadStatistics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'statistics', role: reviewRole, userId: user?.id }),
      });
      const payload = await res.json();
      setStatistics(payload?.data || {});
    } catch (e) {
      console.error(e);
    }
  }, [reviewRole, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLeaveRequests();
      void loadStatistics();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadLeaveRequests, loadStatistics]);

  // Ejecuta la aprobación o rechazo de una novedad desde la tabla principal.
  const handleReview = async (id, reviewAction) => {
    const result = await Swal.fire(reviewAction === 'reject'
      ? {
        title: 'Rechazar novedad',
        input: 'textarea',
        inputLabel: 'Observación',
        inputPlaceholder: 'Explica el motivo del rechazo...',
        inputAttributes: { maxlength: 1000, 'aria-label': 'Observación del rechazo' },
        inputValidator: (value) => (!value?.trim() ? 'La observación es obligatoria.' : undefined),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar',
      }
      : {
        title: 'Confirmar aprobación',
        text: '¿Aprobar esta novedad?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar',
      });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/leave-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'review', id, reviewAction, role: reviewRole, userId: user?.id, userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email, observation: result.value || null }),
        });
        const payload = await res.json();
        if (payload?.success) {
          showAlert('Revisión registrada correctamente', 'success');
          await loadLeaveRequests();
          await loadStatistics();
        } else {
          showAlert(payload?.error || 'Error', 'error');
        }
      } catch (e) {
        console.error(e);
        showAlert('Error al actualizar estado', 'error');
      }
    }
  };

  // Elimina una novedad del sistema cuando el usuario con permisos adecuados confirma la acción.
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Eliminar',
      text: '¿Está seguro de eliminar esta novedad?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/leave-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id, role: reviewRole, userId: user?.id }),
        });
        const payload = await res.json();
        if (payload?.success) {
          showAlert('Novedad eliminada correctamente', 'success');
          await loadLeaveRequests();
          await loadStatistics();
        } else {
          showAlert(payload?.error || 'Error', 'error');
        }
      } catch (e) {
        console.error(e);
        showAlert('Error al eliminar', 'error');
      }
    }
  };

  const filteredRequests = leaveRequests.filter(
    (lr) =>
      lr.form_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lr.identification_id?.includes(searchTerm) ||
      lr.leave_class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortLabel = (key) => (sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : '');

  const getSortValue = (request, key) => {
    switch (key) {
      case 'form_full_name':
        return String(request.form_full_name || '').toLocaleLowerCase('es');
      case 'identification_id':
        return String(request.identification_id || '').toLocaleLowerCase('es');
      case 'leave_class':
        return String(request.leave_class || '').toLocaleLowerCase('es');
      case 'leader_name':
        return String(request.leader_name || request.direct_supervisor || 'sin líder').toLocaleLowerCase('es');
      case 'leader_id':
        return String(request.leader_id || '').toLocaleLowerCase('es');
      case 'status':
        return String(request.state_name || request.status || '').toLocaleLowerCase('es');
      case 'created_at':
        return new Date(request.created_at || 0).getTime();
      default:
        return String(request[key] || '').toLocaleLowerCase('es');
    }
  };

  const sortedRequests = useMemo(() => {
    const rows = [...filteredRequests];
    rows.sort((first, second) => {
      const firstValue = getSortValue(first, sortConfig.key);
      const secondValue = getSortValue(second, sortConfig.key);
      const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), 'es', { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [filteredRequests, sortConfig]);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      leader_pending: '#FFA500',
      hr_pending: '#f59e0b',
      approved: '#16a34a',
      leader_approved: '#16a34a',
      hr_approved: '#15803d',
      rejected: '#dc2626',
      leader_rejected: '#dc2626',
      hr_rejected: '#b91c1c',
      created: '#64748b',
      completed: '#dc2626',
      expired: '#f97316',
      cancelled: '#d97706',
    };
    return colors[status.toLowerCase()] || '#64748b';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', color: '#FFA500' },
      approved: { text: 'Aprobado', color: '#16a34a' },
      rejected: { text: 'Rechazado', color: '#dc2626' },
      completed: { text: 'Finalizada', color: '#dc2626' },
      expired: { text: 'Vencida', color: '#f97316' },
      cancelled: { text: 'Cancelado', color: '#d97706' },
    };
    return badges[status.toLowerCase()] || { text: status, color: '#64748b' };
  };

  return (
    <main className={styles.pageContainer}>
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Encabezado con título, descripción y botón de recarga del módulo. */}
      <div className={styles.header}>
        {/* Encabezado con título, descripción y botón de actualización */}
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FontAwesomeIcon icon={faClipboardList} />
          </div>
          <div>
            <h1 className={styles.title}>Novedades</h1>
            <p className={styles.description}>
              Gestiona todas las novedades registradas en el sistema
            </p>
          </div>
        </div>
        {/* Botón para recargar la lista y las estadísticas del módulo. */}
        <button
          type="button"
          className={styles.refreshButton}
          onClick={async () => {
            await Promise.all([loadLeaveRequests(), loadStatistics()]);
          }}
          disabled={loading}
          title="Actualizar novedades"
        >
          <FontAwesomeIcon icon={faRefresh} spin={loading} />
          Actualizar
        </button>
      </div>

      {/* Statistics */}
      {/* Tarjetas de estadísticas rápidas del estado de las novedades. */}
      {statistics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.total}</div>
            <div className={styles.statLabel}>Total de Novedades</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: '#FFA500' }}>
            <div className={styles.statValue} style={{ color: '#FFA500' }}>
              {statistics.pending}
            </div>
            <div className={styles.statLabel}>Pendientes</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: '#16a34a' }}>
            <div className={styles.statValue} style={{ color: '#16a34a' }}>
              {statistics.approved}
            </div>
            <div className={styles.statLabel}>Aprobadas</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: '#dc2626' }}>
            <div className={styles.statValue} style={{ color: '#dc2626' }}>
              {statistics.rejected}
            </div>
            <div className={styles.statLabel}>Rechazadas</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {/* Filtros y búsqueda para ubicar rápidamente una novedad concreta. */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por nombre, identificación o tipo de novedad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Todos los estados</option>
          <option value="Pending">Pendiente</option>
          <option value="Approved">Aprobado</option>
          <option value="Rejected">Rechazado</option>
          <option value="Cancelled">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Cargando...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No hay novedades registradas
          </div>
        ) : (
          <div className={styles.tableScrollContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('form_full_name')}>Nombre{sortLabel('form_full_name')}</button></th>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('identification_id')}>Identificación{sortLabel('identification_id')}</button></th>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('leave_class')}>Tipo de novedad{sortLabel('leave_class')}</button></th>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('leader_name')}>Supervisor{sortLabel('leader_name')}</button></th>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('leader_id')}>ID líder{sortLabel('leader_id')}</button></th>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('status')}>Estado{sortLabel('status')}</button></th>
                  <th><button type="button" className={styles.sortHeaderButton} onClick={() => handleSort('created_at')}>Fecha{sortLabel('created_at')}</button></th>
                  <th style={{ width: '200px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedRequests.map((lr) => {
                  const statusBadge = lr.state_name
                    ? { text: lr.state_name, color: getStatusColor(lr.state_code || lr.status) }
                    : getStatusBadge(lr.status);
                  return (
                    <Fragment key={lr.id}>
                    <tr className={styles.requestRow} key={lr.id}>
                      <td>
                        <strong>{lr.form_full_name}</strong>
                      </td>
                      <td>{lr.identification_id}</td>
                      <td>{lr.leave_class}</td>
                      <td>{lr.leader_name || lr.direct_supervisor || 'Sin líder'}</td>
                      <td>{lr.leader_id || 'Sin líder'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${statusBadge.color}20`,
                            color: statusBadge.color,
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {statusBadge.text}
                        </span>
                      </td>
                      <td>{new Date(lr.created_at).toLocaleDateString('es-CO')}</td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.viewButton}
                          onClick={() => setDetailModal({ isOpen: true, data: lr })}
                          title="Ver detalles"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        {/* Botones de revisión disponibles solo para los estados que aún requieren aprobación. */}
                        {((reviewRole === 'leader' && ['created', 'leader_pending'].includes(lr.state_code || 'created')) || (reviewRole === 'hr' && lr.state_code === 'hr_pending')) && (
                          <>
                            <button
                              className={styles.approveButton}
                              onClick={() => handleReview(lr.id, 'approve')}
                              title="Aprobar"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() => handleReview(lr.id, 'reject')}
                              title="Rechazar"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </>
                        )}
                        {reviewRole === 'admin' && <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(lr.id)}
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>}
                      </td>
                    </tr>
                    <tr className={styles.timelineRow} key={`${lr.id}-timeline`}>
                      <td colSpan="8">
                        <RequestTimeline request={lr} />
                      </td>
                    </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailModal
        isOpen={detailModal.isOpen}
        data={detailModal.data}
        onClose={() => setDetailModal({ isOpen: false, data: null })}
      />
    </main>
  );
}
