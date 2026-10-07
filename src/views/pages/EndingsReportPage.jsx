import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { deploymentModel } from '../../models/deploymentModel';
import { duModel } from '../../models/duModel';
import { projectModel } from '../../models/projectModel';
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
  { key: 'next30', label: 'Next 30 days', fn: presetNext30 },
  { key: 'next2',  label: 'Next 2 months', fn: presetNext2Months },
  { key: 'next3',  label: 'Next 3 months', fn: presetNext3Months },
  { key: 'next6',  label: 'Next 6 months', fn: presetNext6Months },
];

export const EndingsReportPage = () => {
  // ─── Filter mode state ──────────────────────────────
  // mode: 'all' | 'quick' | 'range'
  const [mode, setMode] = useState('all');

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // ─── Compute effective date range based on mode ─────
  const effectiveRange = useMemo(() => {
    if (mode === 'quick' && activePreset) {
      const preset = PRESETS.find((p) => p.key === activePreset);
      return preset ? preset.fn() : null;
    }
    if (mode === 'range' && fromDate && toDate) {
      return { from: fromDate, to: toDate };
    }
    return null; // 'all' mode → no date filter
  }, [mode, activePreset, fromDate, toDate]);

  // ─── Fetch endings ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (effectiveRange) {
        // With date filter
        if (effectiveRange.from > effectiveRange.to) {
          setError('From date must be on or before To date');
          setRows([]);
          setLoading(false);
          return;
        }
        data = await deploymentModel.getEndingsInRange(
          effectiveRange.from,
          effectiveRange.to
        );
      } else {
        // No date filter → show ALL active deployments with a plan end
        // Use a very wide range
        data = await deploymentModel.getEndingsInRange(
          '2020-01-01',
          '2099-12-31'
        );
      }
      setRows(data || []);
    } catch (err) {
      console.error('Endings report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [effectiveRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    setMode(checked ? 'quick' : 'all');
    if (checked) {
      setActivePreset(null);
    }
  };

  const toggleDateRange = (checked) => {
    setMode(checked ? 'range' : 'all');
  };

  const applyPreset = (key) => {
    setActivePreset(key);
  };

  const clearAllFilters = () => {
    setMode('all');
    setActivePreset(null);
    setFromDate('');
    setToDate('');
    setFilterDu('');
    setFilterProject('');
  };

  const hasAnyFilter =
    mode !== 'all' || filterDu || filterProject;

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

    // Build subtitle
    let rangeText = 'All deployments';
    if (mode === 'quick' && activePreset) {
      const p = PRESETS.find((x) => x.key === activePreset);
      rangeText = `Quick: ${p?.label}`;
    } else if (mode === 'range' && fromDate && toDate) {
      rangeText = `Range: ${fromDate} → ${toDate}`;
    }

    await exportToExcel(exportRows, columns, `Endings_Report`, {
      title: 'Deployment Endings Report',
      subtitle: `${rangeText} · Generated on ${new Date().toLocaleDateString('en-GB')}`,
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
      <header className="dashboard-header">
        <div>
          <h1>Deployment Endings Report</h1>
          <p className="report-subtitle">
            {mode === 'all' && 'Showing all active deployments'}
            {mode === 'quick' && activePreset && `Quick range: ${PRESETS.find(p => p.key === activePreset)?.label}`}
            {mode === 'quick' && !activePreset && 'Select a quick range below'}
            {mode === 'range' && fromDate && toDate && `From ${fromDate} to ${toDate}`}
            {mode === 'range' && (!fromDate || !toDate) && 'Fill in both dates'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={filteredRows.length === 0}
          >
            ⬇ Export to Excel
          </button>
          <button onClick={fetchData} className="btn-refresh" disabled={loading}>
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* ══════════════════════════════════════════════
          FILTER SELECTION
          ══════════════════════════════════════════════ */}
      <div className="filter-mode-group">
        {/* Quick Ranges */}
        <div className="filter-mode-block">
          <label className="filter-mode-checkbox">
            <input
              type="checkbox"
              checked={mode === 'quick'}
              onChange={(e) => toggleQuickRanges(e.target.checked)}
            />
            <span className="filter-mode-label">Quick Ranges</span>
          </label>

          <div className={`preset-bar ${mode !== 'quick' ? 'disabled' : ''}`}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`preset-btn ${activePreset === p.key ? 'preset-active' : ''}`}
                onClick={() => applyPreset(p.key)}
                disabled={mode !== 'quick'}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="filter-mode-block">
          <label className="filter-mode-checkbox">
            <input
              type="checkbox"
              checked={mode === 'range'}
              onChange={(e) => toggleDateRange(e.target.checked)}
            />
            <span className="filter-mode-label">Date Range</span>
          </label>

          <div className={`date-range-row ${mode !== 'range' ? 'disabled' : ''}`}>
            <div className="filter-group">
              <label>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={mode !== 'range'}
              />
            </div>
            <div className="filter-group">
              <label>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={mode !== 'range'}
              />
            </div>
          </div>
        </div>
      </div>

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
      <div className="table-container" style={{ position: 'relative' }}>
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
                  {mode === 'quick' && !activePreset
                    ? 'Pick a quick range to see results.'
                    : mode === 'range' && (!fromDate || !toDate)
                    ? 'Fill in both dates to see results.'
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
      </div>
    </div>
  );
};