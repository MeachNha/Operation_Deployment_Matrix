import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { useProjectsController } from '../../controllers/useProjectsController';
import { ProjectDuAssignmentModal } from '../components/ProjectDuAssignmentModal';

const TUTORIAL_STEPS = [
  {
    title: 'Find a project',
    description: 'Search by project code or name, then narrow the list by contract dates or status. Clear filters to restore the full list.',
  },
  {
    title: 'Create or edit project details',
    description: 'Choose Add New Project to create a project, or select Edit in a row to update its information.',
  },
  {
    title: 'Manage DU assignments',
    description: 'Use the DU assignment action in a project row to manage the demining units assigned to that project.',
  },
];

const STATUSES = ['planned', 'active', 'completed', 'cancelled'];

export const ProjectsPage = () => {
  const { projects, loading, saving, error, createProject, updateProject, deleteProject } =
    useProjectsController();

  // ─── Filters + search ───────────────────────────────
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [duModalOpen, setDuModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    contract_start_date: '',
    contract_end_date: '',
    status: 'active',
    remarks: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // ─── Filtered projects ──────────────────────────────
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Search by code or name
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          (p.code || '').toLowerCase().includes(q) ||
          (p.name || '').toLowerCase().includes(q)
        );
      });
    }

    // Date range filter (contract overlap)
    if (dateFrom || dateTo) {
      const fromBound = dateFrom || '0001-01-01';
      const toBound = dateTo || '9999-12-31';

      result = result.filter((p) => {
        // Overlap check
        return (
          p.contract_start_date <= toBound &&
          p.contract_end_date >= fromBound
        );
      });
    }

    // Status filter
    if (filterStatus) {
      result = result.filter((p) => p.status === filterStatus);
    }

    return result;
  }, [projects, search, dateFrom, dateTo, filterStatus]);

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setFilterStatus('');
  };

  const hasActiveFilters = search || dateFrom || dateTo || filterStatus;

  // ─── Modal handlers ─────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({
      code: '',
      name: '',
      contract_start_date: '',
      contract_end_date: '',
      status: 'active',
      remarks: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      code: p.code,
      name: p.name || '',
      contract_start_date: p.contract_start_date || '',
      contract_end_date: p.contract_end_date || '',
      status: p.status || 'active',
      remarks: p.remarks || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.code.trim()) errors.code = 'Required';
    if (!form.contract_start_date) errors.contract_start_date = 'Required';
    if (!form.contract_end_date) errors.contract_end_date = 'Required';
    if (
      form.contract_start_date &&
      form.contract_end_date &&
      form.contract_end_date < form.contract_start_date
    ) {
      errors.contract_end_date = 'Must be on or after start';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const data = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim() || null,
      contract_start_date: form.contract_start_date,
      contract_end_date: form.contract_end_date,
      status: form.status,
      remarks: form.remarks.trim() || null,
    };

    const result = editing
      ? await updateProject(editing.id, data)
      : await createProject(data);

    if (result.success) {
      setModalOpen(false);
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleDelete = async (p) => {
    if (
      window.confirm(
        `Delete project "${p.code}"? This will delete all related DU assignments.`
      )
    ) {
      const result = await deleteProject(p.id);
      if (!result.success) alert('Error: ' + result.error);
    }
  };

  const handleManageDus = (project) => {
    setSelectedProject(project);
    setDuModalOpen(true);
  };

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="data-page">
      <PageHeader>
        <div>
          <h1>Projects</h1>
          <p className="report-subtitle">
            {filteredProjects.length} of {projects.length} projects
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add New Project
        </button>
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help managing projects?"
        title="How to manage Projects"
        intro="Maintain project details and their DU assignments for use in deployment records."
        steps={TUTORIAL_STEPS}
        reminder="Review project dates and status before saving changes."
      />

      {error && <div className="error-banner">{error}</div>}

      {/* ─── Toolbar: search + date range + status ─── */}
      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by project code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="date-range-group">
          <label className="date-label">From</label>
          <input
            type="date"
            className="filter-date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="date-range-group">
          <label className="date-label">To</label>
          <input
            type="date"
            className="filter-date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button className="btn-reset" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      <TableHorizontalScroll>
        <table className="deployments-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Code</th>
              <th>Name</th>
              <th>Contract Start</th>
              <th>Contract End</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  {hasActiveFilters
                    ? 'No projects match the current filters.'
                    : 'No projects yet. Click "Add New Project" to create one.'}
                </td>
              </tr>
            ) : (
              filteredProjects.map((p, idx) => (
                <tr key={p.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{p.code}</strong></td>
                  <td>{p.name || '—'}</td>
                  <td>{p.contract_start_date}</td>
                  <td>{p.contract_end_date}</td>
                  <td>
                    <span className={`status-badge status-${p.status}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-transfer"
                        onClick={() => handleManageDus(p)}
                      >
                        🏢 DUs
                      </button>
                      <button
                        className="btn-sm"
                        style={{ background: '#805ad5', color: 'white' }}
                        onClick={() => openEdit(p)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(p)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableHorizontalScroll>

      {/* ─── Add/Edit Modal ─── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Project' : 'Add New Project'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Project Code *</label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                      placeholder="e.g., USA27"
                    />
                    {formErrors.code && (
                      <span className="form-error">{formErrors.code}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g., USA Project 27"
                    />
                  </div>

                  <div className="form-group">
                    <label>Contract Start *</label>
                    <input
                      type="date"
                      value={form.contract_start_date}
                      onChange={(e) =>
                        setForm({ ...form, contract_start_date: e.target.value })
                      }
                    />
                    {formErrors.contract_start_date && (
                      <span className="form-error">
                        {formErrors.contract_start_date}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Contract End *</label>
                    <input
                      type="date"
                      value={form.contract_end_date}
                      onChange={(e) =>
                        setForm({ ...form, contract_end_date: e.target.value })
                      }
                    />
                    {formErrors.contract_end_date && (
                      <span className="form-error">
                        {formErrors.contract_end_date}
                      </span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Remarks</label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Project DU Assignment Modal ─── */}
      <ProjectDuAssignmentModal
        isOpen={duModalOpen}
        onClose={() => {
          setDuModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSuccess={() => {}}
      />
    </div>
  );
};