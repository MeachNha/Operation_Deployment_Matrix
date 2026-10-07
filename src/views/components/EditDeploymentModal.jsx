import React, { useState, useEffect, useMemo } from 'react';
import { deploymentModel } from '../../models/deploymentModel';

export const EditDeploymentModal = ({
  isOpen,
  onClose,
  deployment,
  dus = [],
  projects = [],
  onSuccess,
}) => {
  const [form, setForm] = useState({
    assigned_du_id: '',
    project_id: '',
    province: '',
    start_deploy: '',
    plan_end_deploy: '',
    end_deploy: '',
    status: 'active',
    ops_letter_ref: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (deployment && isOpen) {
      setForm({
        assigned_du_id: deployment.assigned_du_id || '',
        project_id: deployment.project_id || '',
        province: deployment.province || '',
        start_deploy: deployment.start_deploy || '',
        plan_end_deploy: deployment.plan_end_deploy || '',
        end_deploy: deployment.end_deploy || '',
        status: deployment.status || 'active',
        ops_letter_ref: deployment.ops_letter_ref || '',
        remarks: deployment.remarks || '',
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [deployment, isOpen]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === form.project_id),
    [projects, form.project_id]
  );

  if (!isOpen || !deployment) return null;

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // ─── AUTO-FILL when project changes AND dates are empty ───
      if (key === 'project_id') {
        const project = projects.find((p) => p.id === value);
        if (project) {
          // Only fill if the field is currently empty
          if (!prev.start_deploy) {
            next.start_deploy = project.contract_start_date;
          }
          if (!prev.plan_end_deploy) {
            next.plan_end_deploy = project.contract_end_date;
          }
        }
      }

      // Auto-clear end_deploy when switching to active
      if (key === 'status' && value === 'active') {
        next.end_deploy = '';
      }

      // Auto-set today as end_deploy when switching to completed/cancelled
      if (
        key === 'status' &&
        (value === 'completed' || value === 'cancelled') &&
        !prev.end_deploy
      ) {
        next.end_deploy = new Date().toISOString().split('T')[0];
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setSubmitError(null);
  };

  const validate = () => {
    const next = {};
    if (!form.assigned_du_id) next.assigned_du_id = 'Please select a DU';
    if (!form.project_id) next.project_id = 'Please select a project';
    if (!form.start_deploy) next.start_deploy = 'Start date is required';

    if (form.plan_end_deploy && form.plan_end_deploy < form.start_deploy) {
      next.plan_end_deploy = 'Plan end must be on or after start date';
    }

    if (form.status === 'active') {
      if (form.end_deploy) {
        next.status =
          'Active deployments cannot have an actual end date.';
      }
    } else {
      if (!form.end_deploy) {
        next.status = `${
          form.status === 'completed' ? 'Completed' : 'Cancelled'
        } deployments must have an actual end date.`;
      }
      if (form.end_deploy && form.end_deploy < form.start_deploy) {
        next.end_deploy = 'End date must be on or after start date';
      }
    }

    if (selectedProject) {
      if (form.start_deploy < selectedProject.contract_start_date) {
        next.start_deploy = `Must be on or after contract start (${selectedProject.contract_start_date})`;
      }
      if (
        form.plan_end_deploy &&
        form.plan_end_deploy > selectedProject.contract_end_date
      ) {
        next.plan_end_deploy = `Must be on or before contract end (${selectedProject.contract_end_date})`;
      }
      if (
        form.end_deploy &&
        form.end_deploy > selectedProject.contract_end_date
      ) {
        next.end_deploy = `Must be on or before contract end (${selectedProject.contract_end_date})`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    try {
      const payload = {
        assigned_du_id: form.assigned_du_id,
        project_id: form.project_id,
        province: form.province.trim() || null,
        start_deploy: form.start_deploy,
        plan_end_deploy: form.plan_end_deploy || null,
        end_deploy: form.status === 'active' ? null : form.end_deploy,
        status: form.status,
        ops_letter_ref: form.ops_letter_ref.trim() || null,
        remarks: form.remarks.trim() || null,
      };

      await deploymentModel.update(deployment.id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setSubmitError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Deployment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="current-info">
            <p>
              <strong>Team:</strong> {deployment.team?.team_code} (
              {deployment.team?.mat}, {deployment.team?.staff_count} staff)
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Status */}
              <div className="form-group full-width">
                <label>Status *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={form.status === 'active'}
                      onChange={(e) => handleChange('status', e.target.value)}
                    />
                    <span>Active</span>
                    <span className="radio-hint">(currently deployed)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="status"
                      value="completed"
                      checked={form.status === 'completed'}
                      onChange={(e) => handleChange('status', e.target.value)}
                    />
                    <span>Completed</span>
                    <span className="radio-hint">(finished normally)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="status"
                      value="cancelled"
                      checked={form.status === 'cancelled'}
                      onChange={(e) => handleChange('status', e.target.value)}
                    />
                    <span>Cancelled</span>
                    <span className="radio-hint">(stopped early)</span>
                  </label>
                </div>
                {errors.status && (
                  <span className="form-error">{errors.status}</span>
                )}
              </div>

              {/* Assigned DU */}
              <div className="form-group">
                <label>Assigned DU *</label>
                <select
                  value={form.assigned_du_id}
                  onChange={(e) => handleChange('assigned_du_id', e.target.value)}
                >
                  <option value="">Select DU...</option>
                  {dus.map((du) => (
                    <option key={du.id} value={du.id}>
                      {du.code} — {du.name}
                    </option>
                  ))}
                </select>
                {errors.assigned_du_id && (
                  <span className="form-error">{errors.assigned_du_id}</span>
                )}
              </div>

              {/* Project */}
              <div className="form-group">
                <label>Project *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => handleChange('project_id', e.target.value)}
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
                {selectedProject && (
                  <span className="form-hint">
                    Contract: {selectedProject.contract_start_date} →{' '}
                    {selectedProject.contract_end_date}
                  </span>
                )}
                {errors.project_id && (
                  <span className="form-error">{errors.project_id}</span>
                )}
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={form.start_deploy}
                  min={selectedProject?.contract_start_date || undefined}
                  max={selectedProject?.contract_end_date || undefined}
                  onChange={(e) => handleChange('start_deploy', e.target.value)}
                />
                {errors.start_deploy && (
                  <span className="form-error">{errors.start_deploy}</span>
                )}
              </div>

              {/* Planned End Date */}
              <div className="form-group">
                <label>Planned End Date</label>
                <input
                  type="date"
                  value={form.plan_end_deploy}
                  min={form.start_deploy || undefined}
                  max={selectedProject?.contract_end_date || undefined}
                  onChange={(e) =>
                    handleChange('plan_end_deploy', e.target.value)
                  }
                />
                <span className="form-hint">
                  Default: contract end date
                </span>
                {errors.plan_end_deploy && (
                  <span className="form-error">{errors.plan_end_deploy}</span>
                )}
              </div>

              {/* Actual End Date — only for non-active */}
              {form.status !== 'active' && (
                <div className="form-group">
                  <label>Actual End Date *</label>
                  <input
                    type="date"
                    value={form.end_deploy}
                    min={form.start_deploy || undefined}
                    max={selectedProject?.contract_end_date || undefined}
                    onChange={(e) =>
                      handleChange('end_deploy', e.target.value)
                    }
                  />
                  <span className="form-hint">
                    The date the deployment actually ended
                  </span>
                  {errors.end_deploy && (
                    <span className="form-error">{errors.end_deploy}</span>
                  )}
                </div>
              )}

              {/* Province */}
              <div className="form-group">
                <label>Province</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                />
              </div>

              {/* Ops Letter */}
              <div className="form-group">
                <label>Ops Letter Ref</label>
                <input
                  type="text"
                  value={form.ops_letter_ref}
                  onChange={(e) =>
                    handleChange('ops_letter_ref', e.target.value)
                  }
                />
              </div>

              {/* Remarks */}
              <div className="form-group full-width">
                <label>Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {submitError && <div className="error-message">{submitError}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};