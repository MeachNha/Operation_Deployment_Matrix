import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { useDusController } from '../../controllers/useDusController';

const TUTORIAL_STEPS = [
  {
    title: 'Add a demining unit',
    description: 'Choose Add New DU and enter both a unique DU code and a descriptive name.',
  },
  {
    title: 'Update unit details',
    description: 'Choose Edit in a DU row to change its code or name.',
  },
  {
    title: 'Delete an unused unit',
    description: 'Choose Delete to remove a DU, then confirm the action when prompted.',
  },
];

export const DusPage = () => {
  const { dus, loading, saving, error, createDu, updateDu, deleteDu } = useDusController();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '' });
  const [formErrors, setFormErrors] = useState({});

  const openAdd = () => {
    setEditing(null);
    setForm({ code: '', name: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (du) => {
    setEditing(du);
    setForm({ code: du.code, name: du.name || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.code.trim()) errors.code = 'Required';
    if (!form.name.trim()) errors.name = 'Required';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const data = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
    };

    const result = editing
      ? await updateDu(editing.id, data)
      : await createDu(data);

    if (result.success) {
      setModalOpen(false);
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleDelete = async (du) => {
    if (window.confirm(`Delete DU "${du.code}"?`)) {
      const result = await deleteDu(du.id);
      if (!result.success) alert('Error: ' + result.error);
    }
  };

  if (loading) return <div className="loading">Loading DUs...</div>;

  return (
    <div className="data-page">
      <PageHeader>
        <div>
          <h1>Demining Units</h1>
          <p className="report-subtitle">Manage all demining units</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add New DU
        </button>
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help managing DUs?"
        title="How to manage Demining Units"
        intro="Maintain the DU codes and names used throughout deployment management and reporting."
        steps={TUTORIAL_STEPS}
        reminder="Use consistent DU codes so existing records and report filters remain recognizable."
      />

      {error && <div className="error-banner">{error}</div>}

      <TableHorizontalScroll>
        <table className="deployments-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Code</th>
              <th>Name</th>
              <th style={{ textAlign: 'center', width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dus.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-row">
                  No DUs yet. Click "Add New DU" to create one.
                </td>
              </tr>
            ) : (
              dus.map((du, idx) => (
                <tr key={du.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{du.code}</strong></td>
                  <td>{du.name}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-transfer"
                        onClick={() => openEdit(du)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(du)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableHorizontalScroll>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit DU' : 'Add New DU'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>DU Code *</label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="e.g., DU7"
                    />
                    {formErrors.code && <span className="form-error">{formErrors.code}</span>}
                  </div>
                  <div className="form-group full-width">
                    <label>DU Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Demining Unit 7"
                    />
                    {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={saving}>
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
      )}
    </div>
  );
};