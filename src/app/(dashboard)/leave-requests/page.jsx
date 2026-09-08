"use client";

import { Fragment, useCallback, useEffect, useState } from 'react';
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

const Modal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
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

const DetailModal = ({ isOpen, data, onClose }) => {
  if (!data) return null;

  return (
    <Modal isOpen={isOpen} title="Detalles de la Novedad" onClose={onClose}>
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
          <span className={styles.detailLabel}>ID líder:</span>
          <span className={styles.detailValue}>{data.leader_id || 'Sin líder asignado'}</span>
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
          <span className={styles.detailLabel}>Estado actual:</span>
          <span className={`${styles.detailValue} ${styles[`status-${data.status.toLowerCase()}`]}`}>
            {data.state_name || data.status}
          </span>
        </div>
        {data.rejected_by_name && <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Rechazado por:</span>
          <span className={styles.detailValue}>{data.rejected_by_name} ({data.rejected_by_role})</span>
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
        {data.attachment_url && (
          <div className={styles.attachmentPreview}>
            <span className={styles.detailLabel}>Documento soporte:</span>
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
          </div>
        )}
      </div>
    </Modal>
  );
};

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

function RequestTimeline({ request }) {
  const currentState = request.state_code || 'created';
  const events = [
    {
      label: 'Creada', date: request.created_at, actor: request.form_full_name, tone: 'created',
      active: true, current: ['created', 'leader_pending'].includes(currentState),
    },
    {
      label: 'Líder', date: request.leader_approved_at, actor: request.leader_approved_by_name, tone: 'approved',
      active: Boolean(request.leader_approved_at) || ['hr_pending', 'completed', 'hr_rejected'].includes(currentState),
      current: currentState === 'hr_pending',
    },
    {
      label: 'Finalizada', date: request.completed_at, actor: request.completed_by_name, tone: 'completed',
      active: Boolean(request.completed_at) || currentState === 'completed', current: currentState === 'completed',
    },
    {
      label: 'Rechazada', date: request.rejected_at, actor: request.rejected_by_name, tone: 'rejected',
      active: Boolean(request.rejected_at) || ['leader_rejected', 'hr_rejected'].includes(currentState),
      current: ['leader_rejected', 'hr_rejected'].includes(currentState),
    },
  ];

  return (
    <div className={styles.timeline}>
      <span className={styles.timelineTitle}>Trazabilidad</span>
      <div className={styles.timelineEvents}>
        {events.filter((event) => event.tone !== 'rejected' || event.active).map((event) => (
          <div className={`${styles.timelineEvent} ${event.active ? styles[`timeline${event.tone}`] : styles.timelinePending} ${event.current ? styles.timelineCurrent : ''}`} key={event.label}>
            <span className={styles.timelineDot} />
            <div>
              <strong>{event.label}</strong>
              <span>{formatTraceDate(event.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState(null);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
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
      completed: '#0f766e',
      expired: '#6b7280',
      cancelled: '#6b7280',
    };
    return colors[status.toLowerCase()] || '#64748b';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', color: '#FFA500' },
      approved: { text: 'Aprobado', color: '#16a34a' },
      rejected: { text: 'Rechazado', color: '#dc2626' },
      cancelled: { text: 'Cancelado', color: '#6b7280' },
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

      <div className={styles.header}>
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
                  <th>Nombre</th>
                  <th>Identificación</th>
                  <th>Tipo de novedad</th>
                  <th>Supervisor</th>
                  <th>ID líder</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ width: '200px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((lr) => {
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
                        {reviewRole !== 'leader' && <button
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
