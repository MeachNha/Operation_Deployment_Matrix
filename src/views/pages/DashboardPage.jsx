import React, { useCallback, useState } from 'react';
import { useMatrixController } from '../../controllers/useMatrixController';
import { useTransferController } from '../../controllers/useTransferController';
import { FilterBar } from '../components/FilterBar';
import { CreateDeploymentModal } from '../components/CreateDeploymentModal';
import { TransferModal } from '../components/TransferModal';
import { EditDeploymentModal } from '../components/EditDeploymentModal';
import { CancelDeploymentModal } from '../components/CancelDeploymentModal';
import { EndDeploymentModal } from '../components/EndDeploymentModal';
import { DeploymentTutorialModal } from '../components/deployment/DeploymentTutorialModal';
import { DeploymentsTable } from '../components/deployment/DeploymentsTable';
import { PageHeader } from '../components/shared/PageHeader';
import { TutorialTip } from '../components/shared/TutorialTip';

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

  const { undoToPreviousDeployment, loading: undoing } = useTransferController();

  const [createOpen, setCreateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const closeGuide = useCallback(() => setGuideOpen(false), []);

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

  const handleUndo = async (deployment) => {
    const ok = window.confirm(
      `↩ Undo team ${deployment.team?.team_code}'s current deployment?\n\n` +
      `This will:\n` +
      `  • Delete the current deployment (${deployment.project?.code} / ${deployment.assigned_du?.code})\n` +
      `  • Re-activate the team's previous deployment from history\n\n` +
      `This cannot be undone.`
    );
    if (!ok) return;

    const res = await undoToPreviousDeployment({
      currentDeployment: deployment,
    });

    if (!res.success) {
      alert(`⚠️ Undo failed\n\n${res.error}`);
      return;
    }

    refetch();
  };

  if (loading && deployments.length === 0) {
    return <div className="loading">Loading deployment matrix...</div>;
  }

  return (
    <div className="dashboard">
      <PageHeader>
        <h1>Operation Deployment Matrix</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => openModal('create')}>
            + Add Deployment
          </button>
          <button onClick={refetch} className="btn-refresh" disabled={loading}>
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </PageHeader>

      <TutorialTip
        title="New to Team Deployment?"
        onClick={() => setGuideOpen(true)}
      />

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

      {/* Filters — team filter is now passed via teams prop */}
      <FilterBar
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        dus={dus}
        projects={projects}
        teams={teams}
      />

      <DeploymentsTable
        deployments={deployments}
        loading={loading}
        undoing={undoing}
        onOpenModal={openModal}
        onUndo={handleUndo}
      />

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

      <DeploymentTutorialModal
        isOpen={guideOpen}
        onClose={closeGuide}
      />
    </div>
  );
};