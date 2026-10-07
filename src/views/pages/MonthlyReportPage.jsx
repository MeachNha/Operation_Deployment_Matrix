import React, { useState, useMemo } from 'react';
import { useMonthlyReport } from '../../controllers/useMonthlyReport';
import { exportToExcel } from '../../utils/exportToExcel';

const MONTHS = [
  { key: 'm_jan', label: 'Jan' },
  { key: 'm_feb', label: 'Feb' },
  { key: 'm_mar', label: 'Mar' },
  { key: 'm_apr', label: 'Apr' },
  { key: 'm_may', label: 'May' },
  { key: 'm_jun', label: 'Jun' },
  { key: 'm_jul', label: 'Jul' },
  { key: 'm_aug', label: 'Aug' },
  { key: 'm_sep', label: 'Sep' },
  { key: 'm_oct', label: 'Oct' },
  { key: 'm_nov', label: 'Nov' },
  { key: 'm_dec', label: 'Dec' },
];

const MONTH_KEYS = MONTHS.map((m) => m.key);

export const MonthlyReportPage = () => {
  const { year, setYear, rows, loading, error, refetch } =
    useMonthlyReport(2026);

  // ─── Filter state ───────────────────────────────────
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMat, setFilterMat] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterDu, setFilterDu] = useState('');
  const [filterProvince, setFilterProvince] = useState('');

  // ─── Available options from data ────────────────────
  const availableMaterials = useMemo(() => {
    const set = new Set(rows.map((r) => r.mat).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const availableTeams = useMemo(() => {
    const set = new Set(rows.map((r) => r.team_code).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const availableDus = useMemo(() => {
    const set = new Set(rows.map((r) => r.du_code).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // ─── Projects: collect every project code that appears in any month ───
  const availableProjects = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      MONTH_KEYS.forEach((key) => {
        const val = r[key];
        if (val && val !== 'NA') set.add(val);
      });
    });
    return Array.from(set).sort();
  }, [rows]);

  // ─── Filter rows ────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // ── Project filter ──
      if (filterProject) {
        if (filterMonth) {
          // Only check the selected month's cell
          if (r[filterMonth] !== filterProject) return false;
        } else {
          // Check ALL months — row must have the project in at least one month
          const hasProject = MONTH_KEYS.some(
            (key) => r[key] === filterProject
          );
          if (!hasProject) return false;
        }
      }

      // ── Month filter (only if project filter is NOT active) ──
      // When project is filtered with a specific month, the project
      // filter already ensures activity. When only month is set,
      // hide rows where that month is NA.
      if (filterMonth && !filterProject) {
        const value = r[filterMonth];
        if (!value || value === 'NA') return false;
      }

      // ── MAT ──
      if (filterMat && r.mat !== filterMat) return false;

      // ── Team ──
      if (filterTeam && r.team_code !== filterTeam) return false;

      // ── DU ──
      if (filterDu && r.du_code !== filterDu) return false;

      // ── Province ──
      if (filterProvince) {
        const q = filterProvince.toLowerCase();
        const prov = (r.provinces || '').toLowerCase();
        if (!prov.includes(q)) return false;
      }

      return true;
    });
  }, [
    rows,
    filterMonth,
    filterProject,
    filterMat,
    filterTeam,
    filterDu,
    filterProvince,
  ]);

  const hasActiveFilters =
    filterMonth ||
    filterProject ||
    filterMat ||
    filterTeam ||
    filterDu ||
    filterProvince;

  const clearFilters = () => {
    setFilterMonth('');
    setFilterProject('');
    setFilterMat('');
    setFilterTeam('');
    setFilterDu('');
    setFilterProvince('');
  };

  // ─── Export ─────────────────────────────────────────
  const handleExport = async () => {
    const columns = [
      { key: 'index',      label: 'S/N',       align: 'center' },
      { key: 'no',         label: 'No.',       align: 'center' },
      { key: 'mat',        label: 'MAT',       align: 'center' },
      { key: 'team_label', label: 'Team ID' },
      { key: 'du_code',    label: 'DU',        align: 'center' },
      { key: 'provinces',  label: 'Province' },
    ];

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    MONTH_KEYS.forEach((key, i) => {
      columns.push({
        key,
        label: `${monthLabels[i]}-${String(year).slice(-2)}`,
        align: 'center',
      });
    });

    const exportRows = filteredRows.map((r, idx) => ({
      ...r,
      index: idx + 1,
      no: idx + 1,
      team_label: `${r.team_code} (${r.staff_count} staff)`,
    }));

    // Build subtitle with active filters
    const subtitleParts = [`Generated on ${new Date().toLocaleDateString('en-GB')}`];
    if (filterProject) subtitleParts.unshift(`Project: ${filterProject}`);
    if (filterMonth) {
      const monthLabel = MONTHS.find((m) => m.key === filterMonth)?.label;
      subtitleParts.unshift(`Month: ${monthLabel} ${year}`);
    }

    await exportToExcel(exportRows, columns, `Monthly_Report_${year}`, {
      title: `Monthly Deployment Matrix — ${year}`,
      subtitle: subtitleParts.join(' · '),
      sheetName: `Report ${year}`,
    });
  };

  // ─── Loader ─────────────────────────────────────────
  if (loading && rows.length === 0) {
    return <div className="loading">Loading monthly report...</div>;
  }

  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Monthly Deployment Matrix — {year}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="filter-select"
            disabled={loading}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={refetch}
            className="btn-refresh"
            disabled={loading}
          >
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={loading || filteredRows.length === 0}
          >
            ⬇ Export to Excel
          </button>
        </div>
      </header>

      {/* ─── Filter toolbar ─── */}
      <div className="table-toolbar">
        {/* Month filter */}
        <select
          className="filter-select"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{ minWidth: 150 }}
        >
          <option value="">All Months</option>
          {MONTHS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label} {year}
            </option>
          ))}
        </select>

        {/* Project filter */}
        <select
          className="filter-select"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{ minWidth: 150 }}
        >
          <option value="">All Projects</option>
          {availableProjects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

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

        {/* Team filter */}
        <select
          className="filter-select"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
        >
          <option value="">All Teams</option>
          {availableTeams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* DU filter */}
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

        {/* Province search */}
        <div className="search-input-wrapper" style={{ maxWidth: 180 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Province..."
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
          />
          {filterProvince && (
            <button
              className="search-clear"
              onClick={() => setFilterProvince('')}
              title="Clear"
            >
              ×
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button className="btn-reset" onClick={clearFilters}>
            Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <span className="form-hint">
            {filteredRows.length} of {rows.length} rows
            {filterProject && ` · ${filterProject}`}
            {filterMonth && ` · ${MONTHS.find((m) => m.key === filterMonth)?.label}`}
          </span>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="table-container" style={{ position: 'relative' }}>
        {loading && rows.length > 0 && (
          <div className="table-loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <table className="deployments-table pivot-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>No.</th>
              <th>MAT</th>
              <th>Team ID</th>
              <th>DU</th>
              <th>Province</th>
              {MONTHS.map((m) => (
                <th
                  key={m.key}
                  style={{
                    backgroundColor:
                      filterMonth === m.key ? '#2c5282' : undefined,
                    color: filterMonth === m.key ? '#fff' : undefined,
                  }}
                >
                  {m.label}-{String(year).slice(-2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6 + MONTHS.length} className="empty-row">
                  {hasActiveFilters
                    ? 'No rows match the current filters.'
                    : `No data for ${year}`}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={`${row.team_code}-${row.du_code}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{idx + 1}</td>
                  <td>
                    <span className="badge">{row.mat}</span>
                  </td>
                  <td>
                    <strong>{row.team_code}</strong>{' '}
                    <span style={{ color: '#718096', fontSize: 13 }}>
                      ({row.staff_count} staff)
                    </span>
                  </td>
                  <td>{row.du_code}</td>
                  <td>{row.provinces}</td>
                  {MONTHS.map((m) => {
                    const isProjectMatch =
                      filterProject && row[m.key] === filterProject;
                    const isMonthFilter = filterMonth === m.key;

                    return (
                      <td
                        key={m.key}
                        className={
                          row[m.key] === 'NA' ? 'cell-na' : 'cell-project'
                        }
                        style={{
                          outline: isMonthFilter
                            ? '2px solid #4299e1'
                            : undefined,
                          outlineOffset: '-2px',
                          backgroundColor: isProjectMatch
                            ? '#fef3c7'
                            : undefined,
                          fontWeight: isProjectMatch ? 700 : undefined,
                        }}
                      >
                        {row[m.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};