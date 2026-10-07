import React, { useState, useEffect } from 'react';

export const DuModal = ({ isOpen, onClose, onSave, editing, saving }) => {
  const [form, setForm] = useState({ code: '', name: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code || '',
        name: editing.name || '',
      });
    } else {
      setForm({ code: '', name: '' });
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
          <h2>{editing ? 'Edit DU' : 'Add New DU'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>DU Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="e.g., DU7"
                />
                {errors.code && <span className="form-error">{errors.code}</span>}
              </div>

              <div className="form-group full-width">
                <label>DU Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Demining Unit 7"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
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