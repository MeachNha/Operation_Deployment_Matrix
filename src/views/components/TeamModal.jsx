import React, { useState, useEffect } from 'react';

const MATERIAL_TYPES = ['BCS', 'TSC', 'EOD', 'BAC', 'FMT', 'DUO', 'IDT'];

export const TeamModal = ({ isOpen, onClose, onSave, editing, dus = [], saving }) => {
  const [form, setForm] = useState({
    team_code: '',
    mat: 'BCS',
    staff_count: 1,
    home_du_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setForm({
        team_code: editing.team_code || '',
        mat: editing.mat || 'BCS',
        staff_count: editing.staff_count || 1,
        home_du_id: editing.home_du_id || '',
      });
    } else {
      setForm({ team_code: '', mat: 'BCS', staff_count: 1, home_du_id: '' });
    }
    setErrors({});
  }, [editing, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.team_code.trim()) next.team_code = 'Required';
    if (!form.mat) next.mat = 'Required';
    if (!form.staff_count || Number(form.staff_count) < 1)
      next.staff_count = 'Must be at least 1';
    if (!form.home_du_id) next.home_du_id = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      team_code: form.team_code.trim(),
      mat: form.mat,
      staff_count: Number(form.staff_count),
      home_du_id: form.home_du_id,
    };

    const result = await onSave(data);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? 'Edit Team' : 'Add New Team'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Team Code *</label>
                <input
                  type="text"
                  value={form.team_code}
                  onChange={(e) => handleChange('team_code', e.target.value)}
                  placeholder="e.g., BC-S#20"
                />
                {errors.team_code && <span className="form-error">{errors.team_code}</span>}
              </div>

              <div className="form-group">
                <label>Material *</label>
                <select
                  value={form.mat}
                  onChange={(e) => handleChange('mat', e.target.value)}
                >
                  {MATERIAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {errors.mat && <span className="form-error">{errors.mat}</span>}
              </div>

              <div className="form-group">
                <label>Staff Count *</label>
                <input
                  type="number"
                  min="1"
                  value={form.staff_count}
                  onChange={(e) => handleChange('staff_count', e.target.value)}
                />
                {errors.staff_count && <span className="form-error">{errors.staff_count}</span>}
              </div>

              <div className="form-group full-width">
                <label>Home DU *</label>
                <select
                  value={form.home_du_id}
                  onChange={(e) => handleChange('home_du_id', e.target.value)}
                >
                  <option value="">Select DU...</option>
                  {dus.map((du) => (
                    <option key={du.id} value={du.id}>
                      {du.code} - {du.name}
                    </option>
                  ))}
                </select>
                {errors.home_du_id && <span className="form-error">{errors.home_du_id}</span>}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};