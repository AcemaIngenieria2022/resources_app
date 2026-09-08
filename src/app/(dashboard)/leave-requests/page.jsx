"use client";

import { useCallback, useEffect, useState } from 'react';
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
          <span className={styles.detailLabel}>Estado:</span>
          <span className={`${styles.detailValue} ${styles[`status-${data.status.toLowerCase()}`]}`}>
            {data.state_name || data.status}
          </span>
        </div>
        {data.rejected_by_name && <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Rechazado por:</span>
          <span className={styles.detailValue}>{data.rejected_by_name} ({data.rejected_by_role})</span>
        </div>}
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Fecha de Registro:</span>
          <span className={styles.detailValue}>
            {new Date(data.created_at).toLocaleDateString('es-CO')}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState(null);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const { user } = useAuthContext();
  const reviewRole = ['hr', 'rrhh'].includes(String(user?.role || '').toLowerCase().replace(/[.\s]/g, '')) ? 'hr' : 'leader';

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
  }, []);

  const loadLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter !== 'all' 
        ? `/api/admin/leave-requests?status=${statusFilter}`
        : '/api/admin/leave-requests';
      
      const res = await fetch(url);
      const payload = await res.json();
      setLeaveRequests(payload?.data || []);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar novedades', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showAlert]);

  const loadStatistics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'statistics' }),
      });
      const payload = await res.json();
      setStatistics(payload?.data || {});
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadLeaveRequests();
    loadStatistics();
  }, [loadLeaveRequests, loadStatistics]);

  const handleReview = async (id, reviewAction) => {
    const result = await Swal.fire({
      title: 'Confirmar',
      text: `¿${reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'} esta novedad?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/leave-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'review', id, reviewAction, role: reviewRole, userId: user?.id, userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email }),
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
          body: JSON.stringify({ action: 'delete', id }),
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
                    <tr key={lr.id}>
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
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(lr.id)}
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
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
