import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { deploymentModel } from '../../models/deploymentModel';
import { duModel } from '../../models/duModel';
import { projectModel } from '../../models/projectModel';
import { exportToExcel } from '../../utils/exportToExcel';

const TUTORIAL_STEPS = [
  {
    title: 'Choose a search period',
    description: 'Search all deployments, choose a quick range, or enter both dates in Custom date range.',
  },
  {
    title: 'Run the search',
    description: 'Click Search deployments to load the selected period. Changing a period does not reload results until Search is clicked.',
  },
  {
    title: 'Refine and export',
    description: 'Use the DU and Project filters to narrow the results. Refresh reloads the last searched period, and Export downloads the filtered rows.',
  },
];

// ─── Helpers ───
function fmt(date) {
  return date.toISOString().split('T')[0];
}

function presetNext30() {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + 30);
  return { from: fmt(now), to: fmt(to) };
}

function presetNext2Months() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  return { from: fmt(from), to: fmt(to) };
}

function presetNext3Months() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 4, 0);
  return { from: fmt(from), to: fmt(to) };
}

function presetNext6Months() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 7, 0);
  return { from: fmt(from), to: fmt(to) };
}

const PRESETS = [
  { key: 'next30', label: 'Next 30 days', fn: presetNext30 },
  { key: 'next2',  label: 'Next 2 months', fn: presetNext2Months },
  { key: 'next3',  label: 'Next 3 months', fn: presetNext3Months },
  { key: 'next6',  label: 'Next 6 months', fn: presetNext6Months },
];

export const EndingsReportPage = () => {
  // ─── Filter mode state ──────────────────────────────
  // mode: 'none' | 'quick' | 'range'
  const [mode, setMode] = useState('none');

  // Quick range: which preset is active (only if mode === 'quick')
  const [activePreset, setActivePreset] = useState(null);

  // Date range: for 'range' mode (also used to display quick range values)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Reference data
  const [dus, setDus] = useState([]);
  const [projects, setProjects] = useState([]);

  // Results
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedCriteria, setSearchedCriteria] = useState(null);

  // DU + Project filters
  const [filterDu, setFilterDu] = useState('');
  const [filterProject, setFilterProject] = useState('');

  // ─── Fetch reference data ───────────────────────────
useEffect(() => {
  async function load() {
    try {
      const [dusData, projectsData] = await Promise.all([
        duModel.getAll(),
        projectModel.getAll(),
      ]);

      setDus(dusData || []);
      setProjects(projectsData || []);
    } catch (err) {
      console.error('Reference data error:', err);
    }
  }
  load();
}, []);

  // ─── Fetch endings ──────────────────────────────────
  const fetchData = useCallback(async (criteria) => {
    if (!criteria) return;

    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getEndingsInRange(
        criteria.from,
        criteria.to
      );
      setRows(data || []);
    } catch (err) {
      console.error('Endings report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Apply DU + Project filter in memory ────────────
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterDu && r.du_code !== filterDu) return false;
      if (filterProject && r.project_code !== filterProject) return false;
      return true;
    });
  }, [rows, filterDu, filterProject]);

  // ─── Available options for DU/Project filters ───────
  const availableDus = useMemo(() => {
    const set = new Set(rows.map((r) => r.du_code).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const availableProjects = useMemo(() => {
    const set = new Set(rows.map((r) => r.project_code).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // ─── Mode toggles ───────────────────────────────────
  const toggleQuickRanges = (checked) => {
    setMode(checked ? 'quick' : 'none');
    if (checked) {
      setActivePreset(null);
    }
  };

  const toggleDateRange = (checked) => {
    setMode(checked ? 'range' : 'none');
  };

  const applyPreset = (key) => {
    setActivePreset(key);
  };

  const handleSearch = () => {
    let criteria;

    if (mode === 'quick') {
      const preset = PRESETS.find((item) => item.key === activePreset);
      if (!preset) {
        setError('Select a quick range before searching');
        return;
      }
      criteria = { ...preset.fn(), mode: 'quick', label: `Quick: ${preset.label}` };
    } else if (mode === 'range') {
      if (!fromDate || !toDate) {
        setError('Choose both a start and end date before searching');
        return;
      }
      if (fromDate > toDate) {
        setError('From date must be on or before To date');
        return;
      }
      criteria = {
        from: fromDate,
        to: toDate,
        mode: 'range',
        label: `Range: ${fromDate} → ${toDate}`,
      };
    } else {
      setError('Choose a quick range or custom date range before searching');
      return;
    }

    setError(null);
    setSearchedCriteria(criteria);
    fetchData(criteria);
  };

  const clearAllFilters = () => {
    setMode('none');
    setActivePreset(null);
    setFromDate('');
    setToDate('');
    setFilterDu('');
    setFilterProject('');
    setRows([]);
    setSearchedCriteria(null);
    setError(null);
  };

  const hasAnyFilter =
    mode !== 'none' || filterDu || filterProject;

  // ─── Export ─────────────────────────────────────────
  const handleExport = async () => {
    const columns = [
      { key: 'index',           label: 'S/N',            align: 'center' },
      { key: 'team_code',       label: 'Team' },
      { key: 'mat',             label: 'MAT',            align: 'center' },
      { key: 'staff_count',     label: 'Staff',          align: 'center' },
      { key: 'du_code',         label: 'DU',             align: 'center' },
      { key: 'project_code',    label: 'Project',        align: 'center' },
      { key: 'province',        label: 'Province' },
      { key: 'start_deploy',    label: 'Start',          align: 'center' },
      { key: 'plan_end_deploy', label: 'Plan End',       align: 'center' },
      { key: 'days_remaining',  label: 'Days Remaining', align: 'center' },
    ];

    const exportRows = filteredRows.map((r, idx) => ({
      ...r,
      index: idx + 1,
      days_remaining: r.days_remaining ?? '—',
    }));

    await exportToExcel(exportRows, columns, `Endings_Report`, {
      title: 'Deployment Endings Report',
      subtitle: `${searchedCriteria.label} · Generated on ${new Date().toLocaleDateString('en-GB')}`,
      sheetName: 'Endings',
    });
  };

  // ─── Summary ────────────────────────────────────────
  const totalStaff = filteredRows.reduce(
    (sum, r) => sum + (r.staff_count || 0),
    0
  );

  return (
    <div className="dashboard">
      <PageHeader>
        <div>
          <h1>Deployment Endings Report</h1>
          <p className="report-subtitle">
            {searchedCriteria
              ? `Showing ${searchedCriteria.label}`
              : 'Choose a period, then search for deployments ending soon'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={!searchedCriteria || filteredRows.length === 0}
          >
            ⬇ Export to Excel
          </button>
          <button
            onClick={() => fetchData(searchedCriteria)}
            className="btn-refresh"
            disabled={loading || !searchedCriteria}
          >
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help with the Endings Report?"
        title="How to use the Deployment Endings Report"
        intro="Find deployments ending within a selected period and review the remaining time for each team."
        steps={TUTORIAL_STEPS}
        reminder="A quick range or both custom dates are required before searching."
      />

      {error && <div className="error-banner">{error}</div>}

      {/* ══════════════════════════════════════════════
          FILTER SELECTION
          ══════════════════════════════════════════════ */}
      <section className="standout-search-panel" aria-labelledby="endings-search-title">
        <div className="standout-search-heading">
          <span className="standout-search-eyebrow">DEPLOYMENT ENDINGS</span>
          <h2 id="endings-search-title">Choose a search period</h2>
          <p>Choose a quick range or enter custom dates before searching.</p>
        </div>

        <div className="filter-mode-group">
          <div className={`filter-mode-block ${mode === 'quick' ? 'filter-mode-block-active' : ''}`}>
            <label className="filter-mode-checkbox">
              <input
                type="checkbox"
                checked={mode === 'quick'}
                onChange={(e) => toggleQuickRanges(e.target.checked)}
              />
              <span className="filter-mode-icon" aria-hidden="true">⚡</span>
              <span className="filter-mode-copy">
                <strong>Quick ranges</strong>
                <span>Choose a ready-made period</span>
              </span>
            </label>

            <div className={`preset-bar ${mode !== 'quick' ? 'disabled' : ''}`}>
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`preset-btn ${activePreset === p.key ? 'preset-active' : ''}`}
                  aria-pressed={activePreset === p.key}
                  onClick={() => applyPreset(p.key)}
                  disabled={mode !== 'quick'}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`filter-mode-block ${mode === 'range' ? 'filter-mode-block-active' : ''}`}>
            <label className="filter-mode-checkbox">
              <input
                type="checkbox"
                checked={mode === 'range'}
                onChange={(e) => toggleDateRange(e.target.checked)}
              />
              <span className="filter-mode-icon" aria-hidden="true">▦</span>
              <span className="filter-mode-copy">
                <strong>Custom date range</strong>
                <span>Select the exact period to review</span>
              </span>
            </label>

            <div className={`date-range-row ${mode !== 'range' ? 'disabled' : ''}`}>
              <div className="standout-date-field">
                <label htmlFor="endings-date-from">From</label>
                <input
                  id="endings-date-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={mode !== 'range'}
                />
              </div>
              <span className="standout-date-separator" aria-hidden="true">to</span>
              <div className="standout-date-field">
                <label htmlFor="endings-date-to">To</label>
                <input
                  id="endings-date-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={mode !== 'range'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="standout-search-actions">
          <div className="standout-search-status" aria-live="polite">
            {searchedCriteria ? (
              <>
                <span className="standout-search-status-label">Last search</span>
                <strong>{searchedCriteria.label}</strong>
              </>
            ) : (
              <span>Choose a quick range or enter custom dates to get started.</span>
            )}
          </div>
          <button
            type="button"
            className="standout-search-button"
            onClick={handleSearch}
            disabled={
              loading ||
              mode === 'none' ||
              (mode === 'quick' && !activePreset) ||
              (mode === 'range' && (!fromDate || !toDate))
            }
          >
            {loading ? (
              <span className="standout-search-spinner" aria-hidden="true" />
            ) : (
              <svg className="standout-search-icon" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" />
              </svg>
            )}
            {loading ? 'Searching...' : 'Search deployments'}
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DU + PROJECT FILTERS
          ══════════════════════════════════════════════ */}
      <div className="table-toolbar">
        <select
          className="filter-select"
          value={filterDu}
          onChange={(e) => setFilterDu(e.target.value)}
        >
          <option value="">All DUs</option>
          {availableDus.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {availableProjects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {hasAnyFilter && (
          <button className="btn-reset" onClick={clearAllFilters}>
            Clear all
          </button>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <span className="form-hint">
            {filteredRows.length} of {rows.length} deployments
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SUMMARY CARDS
          ══════════════════════════════════════════════ */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{filteredRows.length}</span>
          <span className="stat-label">Deployments Ending</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalStaff}</span>
          <span className="stat-label">Total Staff</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {new Set(filteredRows.map((r) => r.du_code)).size}
          </span>
          <span className="stat-label">DUs Affected</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {new Set(filteredRows.map((r) => r.project_code)).size}
          </span>
          <span className="stat-label">Projects Affected</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TABLE
          ══════════════════════════════════════════════ */}
      <TableHorizontalScroll>
        {loading && rows.length > 0 && (
          <div className="table-loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <table className="deployments-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Team</th>
              <th>MAT</th>
              <th style={{ textAlign: 'center' }}>Staff</th>
              <th>DU</th>
              <th>Project</th>
              <th>Province</th>
              <th>Start</th>
              <th>Plan End</th>
              <th style={{ textAlign: 'center' }}>Days Left</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-row">
                  {!searchedCriteria
                    ? 'Choose a quick range or custom date range, then click Search to see results.'
                    : loading
                      ? 'Loading…'
                      : 'No deployments match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td><strong>{r.team_code}</strong></td>
                  <td><span className="badge">{r.mat}</span></td>
                  <td style={{ textAlign: 'center' }}>{r.staff_count}</td>
                  <td>{r.du_code}</td>
                  <td>{r.project_code}</td>
                  <td>{r.province || '—'}</td>
                  <td>{r.start_deploy}</td>
                  <td>{r.plan_end_deploy}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`status-badge ${
                        r.days_remaining < 0
                          ? 'status-cancelled'
                          : r.days_remaining <= 30
                          ? 'status-planned'
                          : 'status-active'
                      }`}
                    >
                      {r.days_remaining < 0
                        ? `${Math.abs(r.days_remaining)}d overdue`
                        : `${r.days_remaining}d`}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableHorizontalScroll>
    </div>
  );
};