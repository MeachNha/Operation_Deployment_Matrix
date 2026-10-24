import React, { useState, useEffect, useMemo, useRef } from 'react';
import { deploymentModel } from '../../models/deploymentModel';

export const TransferModal = ({
  isOpen,
  onClose,
  deployment,
  teams = [],
  dus = [],
  projects = [],
  onSuccess,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    endDate: today,
    endRemarks: '',
    startDate: today,
    planEndDeploy: '',
    assignedDuId: '',
    projectId: '',
    province: '',
    opsLetterRef: '',
    remarks: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Track whether the user has manually edited planEndDeploy.
  // If not, we keep it synced to the selected project's contract_end_date.
  const planEndEditedRef = useRef(false);

  // Look up a project's default planned end date
  const defaultPlanEndForProject = (projectId) => {
    const p = projects.find((x) => x.id === projectId);
    return p?.contract_end_date || '';
  };

  // ─── Reset form on open ────────────────────────────
  useEffect(() => {
    if (isOpen && deployment) {
      const initialProjectId = deployment.project_id || '';
      planEndEditedRef.current = false;

      setForm({
        endDate: today,
        endRemarks: '',
        startDate: today,
        // Default to the current project's contract end date
        planEndDeploy: defaultPlanEndForProject(initialProjectId),
        assignedDuId: deployment.assigned_du_id || '',
        projectId: initialProjectId,
        province: deployment.province || '',
        opsLetterRef: '',
        remarks: '',
      });
      setError(null);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, deployment, today, projects]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === form.projectId),
    [projects, form.projectId]
  );

  if (!isOpen || !deployment) return null;

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // When project changes, auto-fill planEndDeploy from the new
      // project's contract end date — unless the user already edited it.
      if (key === 'projectId' && !planEndEditedRef.current) {
        next.planEndDeploy = defaultPlanEndForProject(value);
      }
      return next;
    });

    if (key === 'planEndDeploy') {
      planEndEditedRef.current = true;   // user override
    }

    setErrors((prev) => ({ ...prev, [key]: '' }));
    setError(null);
  };

  const validate = () => {
    const next = {};
    if (!form.endDate) next.endDate = 'Required';
    if (!form.startDate) next.startDate = 'Required';
    if (!form.assignedDuId) next.assignedDuId = 'Required';
    if (!form.projectId) next.projectId = 'Required';

    if (form.endDate < deployment.start_deploy) {
      next.endDate = 'End date must be on or after original start';
    }
    if (form.startDate < form.endDate) {
      next.startDate = 'Start date must be on or after the end date';
    }
    if (form.planEndDeploy && form.planEndDeploy < form.startDate) {
      next.planEndDeploy = 'Planned end must be on or after start date';
    }

    if (selectedProject) {
      if (form.startDate < selectedProject.contract_start_date) {
        next.startDate = `Must be on or after contract start (${selectedProject.contract_start_date})`;
      }
      if (form.startDate > selectedProject.contract_end_date) {
        next.startDate = `Must be on or before contract end (${selectedProject.contract_end_date})`;
      }
      if (
        form.planEndDeploy &&
        form.planEndDeploy > selectedProject.contract_end_date
      ) {
        next.planEndDeploy = `Must be on or before contract end (${selectedProject.contract_end_date})`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      await deploymentModel.transferDeployment({
        currentDeploymentId: deployment.id,
        teamId: deployment.team_id,
        endDeploy: form.endDate,
        endRemarks: form.endRemarks.trim() || null,
        startDeploy: form.startDate,
        planEndDeploy: form.planEndDeploy || null,   // ← persisted
        assignedDuId: form.assignedDuId,
        projectId: form.projectId,
        province: form.province.trim() || null,
        opsLetterRef: form.opsLetterRef.trim() || null,
        newRemarks: form.remarks.trim() || null,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Transfer error:', err);
      const msg = err?.message || String(err);

      if (
        msg.includes('DU is not assigned to project') ||
        msg.includes('DU_NOT_ASSIGNED_TO_PROJECT')
      ) {
        alert(
          '⚠️ Cannot transfer\n\n' +
          'The selected DU is not assigned to this project for the deployment date.\n\n' +
          'Please:\n' +
          '  1. Go to the Projects page\n' +
          '  2. Find this project\n' +
          '  3. Click the [🏢 DUs] button\n' +
          '  4. Add the DU assignment\n' +
          '  5. Come back and try the transfer again.\n\n' +
          'Nothing was changed — the current deployment is still active.'
        );
      } else if (msg.includes('CURRENT_NOT_ACTIVE')) {
        alert(
          '⚠️ Cannot transfer\n\n' +
          'This deployment is no longer active. Please refresh the page and try again.'
        );
      } else {
        alert('⚠️ Cannot transfer\n\n' + msg + '\n\nNothing was changed.');
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transfer Team: {deployment.team?.team_code}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="current-info">
            <h3>Current Deployment</h3>
            <p>
              <strong>Team:</strong> {deployment.team?.team_code} (
              {deployment.team?.mat}, {deployment.team?.staff_count} staff)
            </p>
            <p>
              <strong>Project:</strong> {deployment.project?.code} ({deployment.project?.name})
            </p>
            <p><strong>DU:</strong> {deployment.assigned_du?.code}</p>
            <p><strong>Since:</strong> {deployment.start_deploy}</p>
            {deployment.plan_end_deploy && (
              <p><strong>Planned End:</strong> {deployment.plan_end_deploy}</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* End current */}
            <div className="form-section">
              <h3>End Current Deployment</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={deployment.start_deploy}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                  />
                  {errors.endDate && <span className="form-error">{errors.endDate}</span>}
                </div>
                <div className="form-group full-width">
                  <label>End Remarks</label>
                  <input
                    type="text"
                    value={form.endRemarks}
                    onChange={(e) => handleChange('endRemarks', e.target.value)}
                    placeholder="e.g., Contract ended"
                  />
                </div>
              </div>
            </div>

            {/* New deployment */}
            <div className="form-section">
              <h3>New Deployment</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={form.endDate || undefined}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                  {errors.startDate && <span className="form-error">{errors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label>Planned End Date</label>
                  <input
                    type="date"
                    value={form.planEndDeploy}
                    min={form.startDate || undefined}
                    max={selectedProject?.contract_end_date || undefined}
                    onChange={(e) => handleChange('planEndDeploy', e.target.value)}
                  />
                  <span className="form-hint">
                    Defaults to the project's contract end date
                    {selectedProject?.contract_end_date
                      ? ` (${selectedProject.contract_end_date})`
                      : ''}
                    . You can change it later.
                  </span>
                  {errors.planEndDeploy && (
                    <span className="form-error">{errors.planEndDeploy}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Assigned DU *</label>
                  <select
                    value={form.assignedDuId}
                    onChange={(e) => handleChange('assignedDuId', e.target.value)}
                  >
                    <option value="">Select DU...</option>
                    {dus.map((du) => (
                      <option key={du.id} value={du.id}>{du.code} — {du.name}</option>
                    ))}
                  </select>
                  {errors.assignedDuId && <span className="form-error">{errors.assignedDuId}</span>}
                </div>

                <div className="form-group">
                  <label>Project *</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => handleChange('projectId', e.target.value)}
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                  {selectedProject && (
                    <span className="form-hint">
                      Contract: {selectedProject.contract_start_date} → {selectedProject.contract_end_date}
                    </span>
                  )}
                  {errors.projectId && <span className="form-error">{errors.projectId}</span>}
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Ops Letter Ref</label>
                  <input
                    type="text"
                    value={form.opsLetterRef}
                    onChange={(e) => handleChange('opsLetterRef', e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};