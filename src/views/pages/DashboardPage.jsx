import React, { useState } from 'react';
import { useMatrixController } from '../../controllers/useMatrixController';
import { FilterBar } from '../components/FilterBar';
import { CreateDeploymentModal } from '../components/CreateDeploymentModal';
import { TransferModal } from '../components/TransferModal';
import { EditDeploymentModal } from '../components/EditDeploymentModal';
import { CancelDeploymentModal } from '../components/CancelDeploymentModal';
import { EndDeploymentModal } from '../components/EndDeploymentModal';

export const DashboardPage = () => {
  const {
    deployments,
    teams,
    dus,
    projects,
    loading,
    error,
    stats,
    filters,
    updateFilter,
    resetFilters,
    refetch,
    createDeployment,
    endDeployment,
    cancelDeployment,
  } = useMatrixController();

  const [createOpen, setCreateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const openModal = (type, deployment = null) => {
    setSelected(deployment);
    if (type === 'create') setCreateOpen(true);
    if (type === 'transfer') setTransferOpen(true);
    if (type === 'edit') setEditOpen(true);
    if (type === 'cancel') setCancelOpen(true);
    if (type === 'end') setEndOpen(true);
  };

  const closeAll = () => {
    setCreateOpen(false);
    setTransferOpen(false);
    setEditOpen(false);
    setCancelOpen(false);
    setEndOpen(false);
    setSelected(null);
  };

  if (loading && deployments.length === 0) {
    return <div className="loading">Loading deployment matrix...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Operation Deployment Matrix</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => openModal('create')}>
            + Add Deployment
          </button>
          <button onClick={refetch} className="btn-refresh" disabled={loading}>
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalDeployments}</span>
          <span className="stat-label">Total Deployments</span>
        </div>
        <div className="stat-card active">
          <span className="stat-value">{stats.activeDeployments}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-value">{stats.completedDeployments}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.cancelledDeployments}</span>
          <span className="stat-label">Cancelled</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.activeTeams}</span>
          <span className="stat-label">Teams Deployed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalActiveStaff}</span>
          <span className="stat-label">Active Staff</span>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        dus={dus}
        projects={projects}
      />

      {/* Table */}
      <div className="table-container" style={{ position: 'relative' }}>
        {loading && deployments.length > 0 && (
          <div className="table-loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <table className="deployments-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>MAT</th>
              <th>Staff</th>
              <th>DU</th>
              <th>Project</th>
              <th>Province</th>
              <th>Start</th>
              <th>Plan End</th>
              <th>Actual End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deployments.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-row">
                  No deployments yet. Click "+ Add Deployment" to create one.
                </td>
              </tr>
            ) : (
              deployments.map((d) => (
                <tr key={d.id} className={d.status === 'active' ? 'row-active' : ''}>
                  <td><strong>{d.team?.team_code}</strong></td>
                  <td><span className="badge">{d.team?.mat}</span></td>
                  <td>{d.team?.staff_count}</td>
                  <td>{d.assigned_du?.code}</td>
                  <td>{d.project?.code}</td>
                  <td>{d.province || '—'}</td>
                  <td>{d.start_deploy}</td>
                  <td>{d.plan_end_deploy || '—'}</td>
                  <td>{d.end_deploy || '—'}</td>
                  <td>
                    <span className={`status-badge status-${d.status}`}>
                      {d.status === 'active' && 'Active'}
                      {d.status === 'completed' && 'Completed'}
                      {d.status === 'cancelled' && 'Cancelled'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {d.status === 'active' && (
                        <>
                          <button
                            className="btn-sm btn-transfer"
                            onClick={() => openModal('transfer', d)}
                          >
                            Transfer
                          </button>
                          <button
                            className="btn-sm btn-end"
                            onClick={() => openModal('end', d)}
                          >
                            End
                          </button>
                          <button
                            className="btn-sm btn-delete"
                            onClick={() => openModal('cancel', d)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        className="btn-sm"
                        style={{ background: '#805ad5', color: 'white' }}
                        onClick={() => openModal('edit', d)}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CreateDeploymentModal
        isOpen={createOpen}
        onClose={closeAll}
        teams={teams}
        dus={dus}
        projects={projects}
        onCreate={createDeployment}
        saving={loading}
      />

      <TransferModal
        isOpen={transferOpen}
        onClose={closeAll}
        deployment={selected}
        teams={teams}
        dus={dus}
        projects={projects}
        onSuccess={refetch}
      />

      <EditDeploymentModal
        isOpen={editOpen}
        onClose={closeAll}
        deployment={selected}
        dus={dus}
        projects={projects}
        onSuccess={refetch}
      />

      <CancelDeploymentModal
        isOpen={cancelOpen}
        onClose={closeAll}
        deployment={selected}
        onCancel={cancelDeployment}
        saving={loading}
      />

      <EndDeploymentModal
        isOpen={endOpen}
        onClose={closeAll}
        deployment={selected}
        onEnd={endDeployment}
        saving={loading}
      />
    </div>
  );
};