import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { useTeamsController } from '../../controllers/useTeamsController';

const TUTORIAL_STEPS = [
  {
    title: 'Find a team',
    description: 'Search by team code, DU, dog, or ALIS, then use the MAT and DU selectors to narrow the list. Clear the search or filters to see more teams.',
  },
  {
    title: 'Add or update team details',
    description: 'Choose Add New Team to create a team. Use Edit in its row to update team information.',
  },
  {
    title: 'Remove a team when appropriate',
    description: 'Use Delete in the team row only when the team should be removed from the records.',
  },
];

const SUGGESTED_MATERIALS = [
  'BCS', 'TSC', 'EOD', 'BAC', 'FMT', 'DUO', 'IDT',
  'BCT', 'SLD', 'ERD', 'DMT', 'SLV', 'CLR', 'CTD',
  'TSD', 'MDR', 'CDM', 'DMR', 'IED', 'RD', 'DRT',
  'IST', 'NTT', 'UOT', 'MCT', 'FCT', 'SMT', 'SPT',
  'CRT', 'PMT', 'EHP',
];

export const TeamsPage = () => {
  const { teams, dus, loading, saving, error, createTeam, updateTeam, deleteTeam } =
    useTeamsController();

  // ─── Filters + search state ─────────────────────────
  const [search, setSearch] = useState('');
  const [filterMat, setFilterMat] = useState('');
  const [filterDu, setFilterDu] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [useCustomMat, setUseCustomMat] = useState(false);

  const [form, setForm] = useState({
    team_code: '',
    mat: 'BCS',
    staff_count: 1,
    home_du_id: '',
    dog_count: 0,
    alis_count: 0,
    robot_count: 0,
    integrated_with: '',
    equipment_notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // ─── Unique materials present in the data (for the MAT dropdown) ───
  const availableMaterials = useMemo(() => {
    const set = new Set(teams.map((t) => t.mat).filter(Boolean));
    return Array.from(set).sort();
  }, [teams]);

  // ─── Apply search + MAT filter + DU filter ──────────
  const filteredTeams = useMemo(() => {
    let result = teams;

    // Search (text)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((t) => {
        return (
          (t.team_code || '').toLowerCase().includes(q) ||
          (t.mat || '').toLowerCase().includes(q) ||
          (t.home_du?.code || '').toLowerCase().includes(q) ||
          (t.home_du?.name || '').toLowerCase().includes(q) ||
          String(t.staff_count || '').includes(q) ||
          String(t.dog_count || '').includes(q) ||
          String(t.alis_count || '').includes(q) ||
          String(t.robot_count || '').includes(q) ||
          (t.integrated_with || '').toLowerCase().includes(q) ||
          (t.equipment_notes || '').toLowerCase().includes(q)
        );
      });
    }

    // MAT filter
    if (filterMat) {
      result = result.filter((t) => t.mat === filterMat);
    }

    // DU filter
    if (filterDu) {
      result = result.filter((t) => t.home_du?.code === filterDu);
    }

    return result;
  }, [teams, search, filterMat, filterDu]);

  const clearFilters = () => {
    setSearch('');
    setFilterMat('');
    setFilterDu('');
  };

  const hasActiveFilters = search || filterMat || filterDu;

  // ─── Modal handlers ─────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({
      team_code: '',
      mat: 'BCS',
      staff_count: 1,
      home_du_id: '',
      dog_count: 0,
      alis_count: 0,
      robot_count: 0,
      integrated_with: '',
      equipment_notes: '',
    });
    setFormErrors({});
    setUseCustomMat(false);
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      team_code: t.team_code,
      mat: t.mat,
      staff_count: t.staff_count || 1,
      home_du_id: t.home_du_id || '',
      dog_count: t.dog_count || 0,
      alis_count: t.alis_count || 0,
      robot_count: t.robot_count || 0,
      integrated_with: t.integrated_with || '',
      equipment_notes: t.equipment_notes || '',
    });
    setFormErrors({});
    setUseCustomMat(!SUGGESTED_MATERIALS.includes(t.mat));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.team_code.trim()) errors.team_code = 'Required';
    if (!form.mat) errors.mat = 'Required';
    if (!form.staff_count || Number(form.staff_count) < 1)
      errors.staff_count = 'Must be at least 1';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const data = {
      team_code: form.team_code.trim(),
      mat: form.mat.trim().toUpperCase(),
      staff_count: Number(form.staff_count),
      home_du_id: form.home_du_id || null,
      dog_count: Number(form.dog_count) || 0,
      alis_count: Number(form.alis_count) || 0,
      robot_count: Number(form.robot_count) || 0,
      integrated_with: form.integrated_with.trim() || null,
      equipment_notes: form.equipment_notes.trim() || null,
    };

    const result = editing
      ? await updateTeam(editing.id, data)
      : await createTeam(data);

    if (result.success) {
      setModalOpen(false);
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleDelete = async (t) => {
    if (window.confirm(`Delete team "${t.team_code}"?`)) {
      const result = await deleteTeam(t.id);
      if (!result.success) alert('Error: ' + result.error);
    }
  };

  if (loading) return <div className="loading">Loading teams...</div>;

  return (
    <div className="data-page">
      <PageHeader>
        <div>
          <h1>Teams</h1>
          <p className="report-subtitle">
            {filteredTeams.length} of {teams.length} teams
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add New Team
        </button>
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help managing teams?"
        title="How to manage Teams"
        intro="Maintain team records here. Team records are used when creating deployment assignments."
        steps={TUTORIAL_STEPS}
        reminder="Check existing deployments before deleting a team."
      />

      {error && <div className="error-banner">{error}</div>}

      {/* ─── Toolbar: search + filters ─── */}
      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by team code, DU, dog, alis..."
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

        {/* MAT filter */}
        <select
          className="filter-select"
          value={filterMat}
          onChange={(e) => setFilterMat(e.target.value)}
        >
          <option value="">All MAT</option>
          {availableMaterials.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* DU filter */}
        <select
          className="filter-select"
          value={filterDu}
          onChange={(e) => setFilterDu(e.target.value)}
        >
          <option value="">All DU</option>
          {dus.map((du) => (
            <option key={du.id} value={du.code}>
              {du.code}
            </option>
          ))}
        </select>

        {/* Clear button */}
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
              <th>Team Code</th>
              <th>MAT</th>
              <th style={{ textAlign: 'center' }}>Staff</th>
              <th style={{ textAlign: 'center' }}>Dog</th>
              <th style={{ textAlign: 'center' }}>Alis</th>
              <th style={{ textAlign: 'center' }}>Robot</th>
              <th>Home DU</th>
              <th>Integrated</th>
              <th style={{ textAlign: 'center', width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-row">
                  {hasActiveFilters
                    ? 'No teams match the current filters.'
                    : 'No teams yet. Click "Add New Team" to create one.'}
                </td>
              </tr>
            ) : (
              filteredTeams.map((t, idx) => (
                <tr key={t.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{t.team_code}</strong></td>
                  <td><span className="badge">{t.mat}</span></td>
                  <td style={{ textAlign: 'center' }}>{t.staff_count}</td>
                  <td style={{ textAlign: 'center' }}>{t.dog_count ?? 0}</td>
                  <td style={{ textAlign: 'center' }}>{t.alis_count ?? 0}</td>
                  <td style={{ textAlign: 'center' }}>{t.robot_count ?? 0}</td>
                  <td>{t.home_du?.code || '—'}</td>
                  <td>{t.integrated_with || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-transfer"
                        onClick={() => openEdit(t)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(t)}
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

      {/* ─── Add/Edit Modal ───────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Team' : 'Add New Team'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Team Code *</label>
                    <input
                      type="text"
                      value={form.team_code}
                      onChange={(e) => setForm({ ...form, team_code: e.target.value })}
                      placeholder="e.g., BC-S#20"
                    />
                    {formErrors.team_code && (
                      <span className="form-error">{formErrors.team_code}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Material *</label>
                    {!useCustomMat ? (
                      <select
                        value={form.mat}
                        onChange={(e) => setForm({ ...form, mat: e.target.value })}
                      >
                        {SUGGESTED_MATERIALS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.mat}
                        onChange={(e) =>
                          setForm({ ...form, mat: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g., ABC"
                        maxLength={20}
                      />
                    )}
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4299e1',
                        cursor: 'pointer',
                        fontSize: 12,
                        marginTop: 4,
                        padding: 0,
                        textAlign: 'left',
                      }}
                      onClick={() => setUseCustomMat(!useCustomMat)}
                    >
                      {useCustomMat ? '← Back to list' : '+ Use custom material'}
                    </button>
                    {formErrors.mat && (
                      <span className="form-error">{formErrors.mat}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Staff Count *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.staff_count}
                      onChange={(e) =>
                        setForm({ ...form, staff_count: e.target.value })
                      }
                    />
                    {formErrors.staff_count && (
                      <span className="form-error">{formErrors.staff_count}</span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Home DU</label>
                    <select
                      value={form.home_du_id}
                      onChange={(e) =>
                        setForm({ ...form, home_du_id: e.target.value })
                      }
                    >
                      <option value="">None</option>
                      {dus.map((du) => (
                        <option key={du.id} value={du.id}>
                          {du.code} — {du.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Dog</label>
                    <input
                      type="number"
                      min="0"
                      value={form.dog_count}
                      onChange={(e) =>
                        setForm({ ...form, dog_count: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Alis</label>
                    <input
                      type="number"
                      min="0"
                      value={form.alis_count}
                      onChange={(e) =>
                        setForm({ ...form, alis_count: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Robot</label>
                    <input
                      type="number"
                      min="0"
                      value={form.robot_count}
                      onChange={(e) =>
                        setForm({ ...form, robot_count: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Integrated With</label>
                    <input
                      type="text"
                      value={form.integrated_with}
                      onChange={(e) =>
                        setForm({ ...form, integrated_with: e.target.value })
                      }
                      placeholder="e.g., DML#01, BCS-22"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Equipment Notes</label>
                    <textarea
                      value={form.equipment_notes}
                      onChange={(e) =>
                        setForm({ ...form, equipment_notes: e.target.value })
                      }
                      rows={2}
                      placeholder="Anything unusual about equipment"
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