import React, { useState, useEffect, useCallback } from 'react';
import { projectDuAssignmentModel } from '../../models/projectDuAssignmentModel';
import { duModel } from '../../models/duModel';

export const ProjectDuAssignmentModal = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [assignments, setAssignments] = useState([]);
  const [dus, setDus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    du_id: '',
    start_assign: today,
    end_assign: '',
    province: '',
    remarks: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const [assignData, dusData] = await Promise.all([
        projectDuAssignmentModel.getByProject(project.id),
        duModel.getAll(),
      ]);
      setAssignments(assignData);
      setDus(dusData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (isOpen && project) {
      loadData();
      setMode('list');
      setEditing(null);
      setError(null);
    }
  }, [isOpen, project, loadData]);

  if (!isOpen || !project) return null;

  const openAddForm = () => {
    setForm({
      du_id: '',
      start_assign: project.contract_start_date || today,
      end_assign: '',
      province: '',
      remarks: '',
    });
    setFormErrors({});
    setEditing(null);
    setMode('add');
  };

  const openEditForm = (a) => {
    setForm({
      du_id: a.du_id || '',
      start_assign: a.start_assign || today,
      end_assign: a.end_assign || '',
      province: a.province || '',
      remarks: a.remarks || '',
    });
    setFormErrors({});
    setEditing(a);
    setMode('edit');
  };

  const backToList = () => {
    setMode('list');
    setEditing(null);
    setFormErrors({});
  };

  const validate = () => {
    const next = {};
    if (!form.du_id) next.du_id = 'Please select a DU';
    if (!form.start_assign) next.start_assign = 'Start date is required';

    if (form.end_assign && form.end_assign < form.start_assign) {
      next.end_assign = 'End date must be on or after start date';
    }

    if (project) {
      if (form.start_assign < project.contract_start_date) {
        next.start_assign = `Must be on or after contract start (${project.contract_start_date})`;
      }
      if (
        form.end_assign &&
        form.end_assign > project.contract_end_date
      ) {
        next.end_assign = `Must be on or before contract end (${project.contract_end_date})`;
      }
    }

    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        project_id: project.id,
        du_id: form.du_id,
        start_assign: form.start_assign,
        end_assign: form.end_assign || null,
        province: form.province.trim() || null,
        remarks: form.remarks.trim() || null,
      };

      if (editing) {
        await projectDuAssignmentModel.update(editing.id, payload);
      } else {
        await projectDuAssignmentModel.create(payload);
      }

      await loadData();
      onSuccess?.();
      setMode('list');
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnd = async (a) => {
    if (!window.confirm(`End DU ${a.du?.code} assignment for this project?`)) return;

    const endDate = window.prompt('End date (YYYY-MM-DD):', today);
    if (!endDate) return;

    if (endDate < a.start_assign) {
      alert('End date must be on or after start date.');
      return;
    }

    setSaving(true);
    try {
      await projectDuAssignmentModel.endAssignment(a.id, endDate, null);
      await loadData();
      onSuccess?.();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a) => {
    if (
      !window.confirm(
        `Delete DU ${a.du?.code} assignment? This cannot be undone.`
      )
    )
      return;

    setSaving(true);
    try {
      await projectDuAssignmentModel.delete(a.id);
      await loadData();
      onSuccess?.();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'list' && `Manage DUs — ${project.code}`}
            {mode === 'add' && `Add DU Assignment — ${project.code}`}
            {mode === 'edit' && `Edit DU Assignment — ${project.code}`}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {mode === 'list' && (
            <>
              <div className="current-info">
                <p>
                  <strong>Project:</strong> {project.code} — {project.name}
                </p>
                <p>
                  <strong>Contract:</strong> {project.contract_start_date} →{' '}
                  {project.contract_end_date}
                </p>
              </div>

              {error && <div className="error-message">{error}</div>}

              {loading ? (
                <div className="loading">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div
                  className="empty-row"
                  style={{ padding: 40, textAlign: 'center', color: '#a0aec0' }}
                >
                  No DUs assigned yet.
                </div>
              ) : (
                <div className="table-container">
                  <table className="deployments-table">
                    <thead>
                      <tr>
                        <th>DU</th>
                        <th>Province</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id}>
                          <td><strong>{a.du?.code}</strong></td>
                          <td>{a.province || '—'}</td>
                          <td>{a.start_assign}</td>
                          <td>{a.end_assign || '—'}</td>
                          <td>
                            <span className={`status-badge status-${a.status}`}>
                              {a.status === 'active' && 'Active'}
                              {a.status === 'completed' && 'Completed'}
                              {a.status === 'cancelled' && 'Cancelled'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {a.status === 'active' && (
                                <button
                                  className="btn-sm btn-end"
                                  onClick={() => handleEnd(a)}
                                >
                                  End
                                </button>
                              )}
                              <button
                                className="btn-sm btn-transfer"
                                onClick={() => openEditForm(a)}
                              >
                                ✏️ Edit
                              </button>
                              {a.status !== 'active' && (
                                <button
                                  className="btn-sm btn-delete"
                                  onClick={() => handleDelete(a)}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" onClick={onClose}>Close</button>
                <button className="btn-primary" onClick={openAddForm}>
                  + Add DU Assignment
                </button>
              </div>
            </>
          )}

          {(mode === 'add' || mode === 'edit') && (
            <form onSubmit={handleSave}>
              <div className="current-info">
                <p>
                  <strong>Project:</strong> {project.code} — {project.name}
                </p>
                <p>
                  <strong>Contract:</strong> {project.contract_start_date} →{' '}
                  {project.contract_end_date}
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>DU *</label>
                  <select
                    value={form.du_id}
                    onChange={(e) => handleChange('du_id', e.target.value)}
                  >
                    <option value="">Select DU...</option>
                    {dus.map((du) => (
                      <option key={du.id} value={du.id}>
                        {du.code} — {du.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.du_id && (
                    <span className="form-error">{formErrors.du_id}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={form.start_assign}
                    min={project.contract_start_date}
                    max={project.contract_end_date}
                    onChange={(e) =>
                      handleChange('start_assign', e.target.value)
                    }
                  />
                  {formErrors.start_assign && (
                    <span className="form-error">{formErrors.start_assign}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={form.end_assign}
                    min={form.start_assign || project.contract_start_date}
                    max={project.contract_end_date}
                    onChange={(e) =>
                      handleChange('end_assign', e.target.value)
                    }
                  />
                  <span className="form-hint">Leave empty if active</span>
                  {formErrors.end_assign && (
                    <span className="form-error">{formErrors.end_assign}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) =>
                      handleChange('province', e.target.value)
                    }
                    placeholder="e.g., Siem Reap"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) =>
                      handleChange('remarks', e.target.value)
                    }
                    rows={2}
                    placeholder="Notes about this assignment"
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button type="button" onClick={backToList} disabled={saving}>
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};