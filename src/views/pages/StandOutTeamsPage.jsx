import React, { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { TutorialTip } from '../components/shared/TutorialTip';
import { DeploymentTutorialModal } from '../components/deployment/DeploymentTutorialModal';
import { deploymentModel } from '../../models/deploymentModel';
import { exportToExcel } from '../../utils/exportToExcel';

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
  { key: 'next30', label: 'Next 30 days',  fn: presetNext30 },
  { key: 'next2',  label: 'Next 2 months', fn: presetNext2Months },
  { key: 'next3',  label: 'Next 3 months', fn: presetNext3Months },
  { key: 'next6',  label: 'Next 6 months', fn: presetNext6Months },
];

const TUTORIAL_STEPS = [
  {
    title: 'Choose a period',
    description:
      'Select Quick ranges and choose a preset, or select Custom date range and enter both dates.',
  },
  {
    title: 'Run your search',
    description:
      'Click Search teams to load teams without project work during the selected period. Changing the period does not run a new search until you click Search again.',
  },
  {
    title: 'Narrow the results',
    description:
      'Use the DU, Project, and MAT filters to refine the results. These filters update the displayed results immediately.',
  },
  {
    title: 'Refresh or export',
    description:
      'Refresh reloads the last searched period. Export to Excel downloads the currently filtered results.',
  },
];

export const StandOutTeamsPage = () => {
  const [mode, setMode] = useState('none');   // 'none' | 'quick' | 'range'
  const [activePreset, setActivePreset] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchedRange, setSearchedRange] = useState(null);

  const [filterDu, setFilterDu] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMat, setFilterMat] = useState('');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const closeTutorial = useCallback(() => setTutorialOpen(false), []);

  // ─── Fetch ──────────────────────────────────────────
  const fetchData = useCallback(async (range) => {
    if (!range) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (range.from > range.to) {
        setError('From date must be on or before To date');
        setRows([]);
        return;
      }
      const data = await deploymentModel.getStandOutTeams(
        range.from,
        range.to
      );
      setRows(data || []);
    } catch (err) {
      console.error('Stand-out teams error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── In-memory filters ──────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterDu && r.last_du_code !== filterDu) return false;
      if (filterProject && r.last_project_code !== filterProject) return false;
      if (filterMat && r.mat !== filterMat) return false;
      return true;
    });
  }, [rows, filterDu, filterProject, filterMat]);

  const availableDus = useMemo(() => {
    const s = new Set(rows.map((r) => r.last_du_code).filter(Boolean));
    return Array.from(s).sort();
  }, [rows]);

  const availableProjects = useMemo(() => {
    const s = new Set(rows.map((r) => r.last_project_code).filter(Boolean));
    return Array.from(s).sort();
  }, [rows]);

  const availableMats = useMemo(() => {
    const s = new Set(rows.map((r) => r.mat).filter(Boolean));
    return Array.from(s).sort();
  }, [rows]);

  // ─── Mode toggles ───────────────────────────────────
  const toggleQuick = (checked) => {
    setMode(checked ? 'quick' : 'none');
    if (!checked) setActivePreset(null);
  };

  const toggleRange = (checked) => {
    setMode(checked ? 'range' : 'none');
  };

  const handleSearch = () => {
    let range;
    let rangeLabel;

    if (mode === 'quick' && activePreset) {
      const preset = PRESETS.find((item) => item.key === activePreset);
      if (!preset) return;
      range = preset.fn();
      rangeLabel = `Quick: ${preset.label}`;
    } else if (mode === 'range' && fromDate && toDate) {
      if (fromDate > toDate) {
        setError('From date must be on or before To date');
        return;
      }
      range = { from: fromDate, to: toDate };
      rangeLabel = `Range: ${fromDate} → ${toDate}`;
    } else {
      setError(
        mode === 'quick'
          ? 'Select a quick range before searching'
          : mode === 'range'
            ? 'Choose both a start and end date before searching'
            : 'Choose a quick range or date range before searching'
      );
      return;
    }

    const nextSearchedRange = { ...range, label: rangeLabel };
    setError(null);
    setSearchedRange(nextSearchedRange);
    fetchData(nextSearchedRange);
  };

  const clearAll = () => {
    setMode('none');
    setActivePreset(null);
    setFromDate('');
    setToDate('');
    setFilterDu('');
    setFilterProject('');
    setFilterMat('');
    setSearchedRange(null);
    setRows([]);
    setError(null);
  };

  const hasAnyFilter = filterDu || filterProject || filterMat;

  // ─── Export ─────────────────────────────────────────
  const handleExport = async () => {
 const columns = [
  { key: 'index',             label: 'S/N',           align: 'center' },
  { key: 'team_code',         label: 'Team' },
  { key: 'last_du_code',      label: 'DU',            align: 'center' },
  { key: 'mat',               label: 'MAT',           align: 'center' },
  { key: 'staff_count',       label: 'Staff',         align: 'center' },
  { key: 'last_project_code', label: 'Last Project',  align: 'center' },
  { key: 'last_province',     label: 'Last Province' },
  { key: 'last_plan_end',     label: 'Last Plan End', align: 'center' },
];

const exportRows = filteredRows.map((r, idx) => ({
  ...r,
  index: idx + 1,
  last_plan_end:     r.last_plan_end     || '—',
  last_du_code:      r.last_du_code      || '—',
  last_project_code: r.last_project_code || '—',
  last_province:     r.last_province     || '—',
}));
    let rangeText = '';
    if (searchedRange) rangeText = searchedRange.label;

    await exportToExcel(exportRows, columns, `StandOut_Teams`, {
      title: 'Teams Without Project Work',
      subtitle: `${rangeText} · Generated on ${new Date().toLocaleDateString('en-GB')}`,
      sheetName: 'Stand Out',
    });
  };

  const totalStaff = filteredRows.reduce(
    (s, r) => s + (r.staff_count || 0),
    0
  );

  return (
    <div className="dashboard">
      <PageHeader>
        <div>
          <h1>Teams Without Project Work</h1>
          <p className="report-subtitle">
            {searchedRange
              ? `Showing results for ${searchedRange.label}`
              : 'Choose a quick range or date range, then click Search'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={!searchedRange || filteredRows.length === 0}
          >
            ⬇ Export to Excel
          </button>
          <button
            onClick={() => fetchData(searchedRange)}
            className="btn-refresh"
            disabled={loading || !searchedRange}
          >
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </PageHeader>

      <TutorialTip
        title="Need help with Stand Out Teams?"
        onClick={() => setTutorialOpen(true)}
      />

      {error && <div className="error-banner">{error}</div>}

      <section className="standout-search-panel" aria-labelledby="standout-search-title">
        <div className="standout-search-heading">
          <span className="standout-search-eyebrow">TEAM ACTIVITY</span>
          <h2 id="standout-search-title">Choose a search period</h2>
          <p>Pick a quick range or set your own dates, then run the search.</p>
        </div>

        <div className="filter-mode-group">
          <div className={`filter-mode-block ${mode === 'quick' ? 'filter-mode-block-active' : ''}`}>
            <label className="filter-mode-checkbox">
              <input
                type="checkbox"
                checked={mode === 'quick'}
                onChange={(e) => toggleQuick(e.target.checked)}
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
                  onClick={() => setActivePreset(p.key)}
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
                onChange={(e) => toggleRange(e.target.checked)}
              />
              <span className="filter-mode-icon" aria-hidden="true">▦</span>
              <span className="filter-mode-copy">
                <strong>Custom date range</strong>
                <span>Select the exact period to review</span>
              </span>
            </label>

            <div className={`date-range-row ${mode !== 'range' ? 'disabled' : ''}`}>
              <div className="standout-date-field">
                <label htmlFor="standout-date-from">From</label>
                <input
                  id="standout-date-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={mode !== 'range'}
                />
              </div>
              <span className="standout-date-separator" aria-hidden="true">to</span>
              <div className="standout-date-field">
                <label htmlFor="standout-date-to">To</label>
                <input
                  id="standout-date-to"
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
            {searchedRange ? (
              <>
                <span className="standout-search-status-label">Last search</span>
                <strong>{searchedRange.label}</strong>
              </>
            ) : (
              <span>Select a period to get started.</span>
            )}
          </div>
          <button
            type="button"
            className="standout-search-button"
            onClick={handleSearch}
            disabled={
              loading ||
              (mode === 'quick' && !activePreset) ||
              (mode === 'range' && (!fromDate || !toDate)) ||
              mode === 'none'
            }
          >
            {loading ? (
              <span className="standout-search-spinner" aria-hidden="true" />
            ) : (
              <svg
                className="standout-search-icon"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" />
              </svg>
            )}
            {loading ? 'Searching...' : 'Search teams'}
          </button>
        </div>
      </section>

      {/* ─── Result filters ─── */}
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

        <select
          className="filter-select"
          value={filterMat}
          onChange={(e) => setFilterMat(e.target.value)}
        >
          <option value="">All MATs</option>
          {availableMats.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {hasAnyFilter && (
          <button className="btn-reset" onClick={clearAll}>Clear</button>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <span className="form-hint">
            {searchedRange ? `${filteredRows.length} teams` : '—'}
          </span>
        </div>
      </div>

      {/* ─── Summary ─── */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{filteredRows.length}</span>
          <span className="stat-label">Teams Stood Out</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalStaff}</span>
          <span className="stat-label">Staff Impacted</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {new Set(filteredRows.map((r) => r.mat).filter(Boolean)).size}
          </span>
          <span className="stat-label">MATs Affected</span>
        </div>
      </div>

      {/* ─── Table ─── */}
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
              <th>DU</th>
              <th>MAT</th>
              <th style={{ textAlign: 'center' }}>Staff</th>
              <th>Last Project</th>
              <th>Last Province</th>
              <th>Last Plan End</th>
            </tr>
          </thead>
          <tbody>
            {!searchedRange ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  Choose a quick range or date range and click Search to see results.
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  {loading
                    ? 'Loading…'
                    : 'Every team has active project work in this period.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => (
                <tr key={`${r.team_code}::${r.last_du_code ?? 'none'}::${r.team_id}`}>
                  <td>{idx + 1}</td>
                  <td><strong>{r.team_code}</strong></td>
                  <td>{r.last_du_code || '—'}</td>
                  <td><span className="badge">{r.mat}</span></td>
                  <td style={{ textAlign: 'center' }}>{r.staff_count}</td>
                  <td>{r.last_project_code || '—'}</td>
                  <td>{r.last_province || '—'}</td>
                  <td>{r.last_plan_end || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableHorizontalScroll>

      <DeploymentTutorialModal
        isOpen={tutorialOpen}
        onClose={closeTutorial}
        title="How to use Stand Out Teams"
        intro="Find teams without project work in a period, refine the results, and export them for follow-up."
        steps={TUTORIAL_STEPS}
        reminder="Click Search teams after changing the selected period to load the new results."
      />
    </div>
  );
};