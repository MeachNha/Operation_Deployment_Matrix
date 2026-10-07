import React, { useState, useEffect, useMemo } from 'react';
import { SearchableSelect } from './SearchableSelect';

export const CreateDeploymentModal = ({
  isOpen,
  onClose,
  teams = [],
  dus = [],
  projects = [],
  onCreate,
  saving = false,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    team_id: '',
    assigned_du_id: '',
    project_id: '',
    province: '',
    start_deploy: today,
    plan_end_deploy: '',
    ops_letter_ref: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        team_id: '',
        assigned_du_id: '',
        project_id: '',
        province: '',
        start_deploy: today,
        plan_end_deploy: '',
        ops_letter_ref: '',
        remarks: '',
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, today]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === form.project_id),
    [projects, form.project_id]
  );

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === form.team_id),
    [teams, form.team_id]
  );

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // ─── AUTO-FILL when project changes ─────────────
      if (key === 'project_id') {
        const project = projects.find((p) => p.id === value);
        if (project) {
          // Set start_deploy to contract start (if empty or not yet touched)
          if (!prev.start_deploy || prev.start_deploy === today) {
            next.start_deploy = project.contract_start_date;
          }
          // Set plan_end_deploy to contract end
          next.plan_end_deploy = project.contract_end_date;
        }
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setSubmitError(null);
  };

  const validate = () => {
    const next = {};
    if (!form.team_id) next.team_id = 'Please select a team';
    if (!form.assigned_du_id) next.assigned_du_id = 'Please select a DU';
    if (!form.project_id) next.project_id = 'Please select a project';
    if (!form.start_deploy) next.start_deploy = 'Start date is required';

    if (form.plan_end_deploy && form.plan_end_deploy < form.start_deploy) {
      next.plan_end_deploy = 'Must be on or after start date';
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
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      team_id: form.team_id,
      assigned_du_id: form.assigned_du_id,
      project_id: form.project_id,
      province: form.province.trim() || null,
      start_deploy: form.start_deploy,
      plan_end_deploy: form.plan_end_deploy || null,
      ops_letter_ref: form.ops_letter_ref.trim() || null,
      remarks: form.remarks.trim() || null,
    };

    const result = await onCreate(data);
    if (result.success) {
      onClose();
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Deployment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Team */}
              <div className="form-group full-width">
                <label>Team *</label>
                <SearchableSelect
                  options={teams}
                  value={form.team_id}
                  onChange={(id) => handleChange('team_id', id)}
                  placeholder="Search by team code or material..."
                  getLabel={(t) =>
                    `${t.team_code} — ${t.mat} (${t.staff_count} staff)`
                  }
                  getValue={(t) => t.id}
                  filterKeys={['team_code', 'mat', 'staff_count']}
                  emptyMessage="No teams match your search"
                />
                {selectedTeam && (
                  <span className="form-hint">
                    Home DU: {selectedTeam.home_du?.code || '—'}
                  </span>
                )}
                {errors.team_id && (
                  <span className="form-error">{errors.team_id}</span>
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
                  {selectedProject
                    ? `Default: ${selectedProject.contract_end_date} (contract end)`
                    : 'Select a project to auto-fill'}
                </span>
                {errors.plan_end_deploy && (
                  <span className="form-error">{errors.plan_end_deploy}</span>
                )}
              </div>

              {/* Province */}
              <div className="form-group">
                <label>Province</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  placeholder="e.g., Siem Reap"
                />
              </div>

              {/* Ops Letter */}
              <div className="form-group">
                <label>Ops Letter Ref</label>
                <input
                  type="text"
                  value={form.ops_letter_ref}
                  onChange={(e) => handleChange('ops_letter_ref', e.target.value)}
                  placeholder="e.g., OPS-2026-001"
                />
              </div>

              {/* Remarks */}
              <div className="form-group full-width">
                <label>Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  rows={2}
                  placeholder="Notes about this deployment"
                />
              </div>
            </div>

            {submitError && <div className="error-message">{submitError}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Deployment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};