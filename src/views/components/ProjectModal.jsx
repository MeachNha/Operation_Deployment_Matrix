import React, { useState, useEffect } from 'react';

export const ProjectModal = ({ isOpen, onClose, onSave, editing, dus = [], saving }) => {
  const [form, setForm] = useState({
    code: '',
    name: '',
    managing_du_id: '',
    contract_start_date: '',
    contract_end_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code || '',
        name: editing.name || '',
        managing_du_id: editing.managing_du_id || '',
        contract_start_date: editing.contract_start_date || '',
        contract_end_date: editing.contract_end_date || '',
      });
    } else {
      setForm({
        code: '',
        name: '',
        managing_du_id: '',
        contract_start_date: '',
        contract_end_date: '',
      });
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
    if (!form.code.trim()) next.code = 'Required';
    if (!form.name.trim()) next.name = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      managing_du_id: form.managing_du_id || null,
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
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
          <h2>{editing ? 'Edit Project' : 'Add New Project'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Project Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="e.g., ADB01"
                />
                {errors.code && <span className="form-error">{errors.code}</span>}
              </div>

              <div className="form-group full-width">
                <label>Project Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., ADB Project 01"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group full-width">
                <label>Managing DU</label>
                <select
                  value={form.managing_du_id}
                  onChange={(e) => handleChange('managing_du_id', e.target.value)}
                >
                  <option value="">None</option>
                  {dus.map((du) => (
                    <option key={du.id} value={du.id}>
                      {du.code} - {du.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Contract Start Date</label>
                <input
                  type="date"
                  value={form.contract_start_date}
                  onChange={(e) => handleChange('contract_start_date', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Contract End Date</label>
                <input
                  type="date"
                  value={form.contract_end_date}
                  onChange={(e) => handleChange('contract_end_date', e.target.value)}
                />
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