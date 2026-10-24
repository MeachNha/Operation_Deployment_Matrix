import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { useTeamMovement } from '../../controllers/useTeamMovement';
import { exportToExcel } from '../../utils/exportToExcel';

const TUTORIAL_STEPS = [
  {
    title: 'Choose a year',
    description: 'Select a year in the header to load the team movement data for that year.',
  },
  {
    title: 'Filter the movement matrix',
    description: 'Use the month, team, MAT, DU, and project filters to focus on specific records. Clear filters to restore the full list.',
  },
  {
    title: 'Review and export',
    description: 'Scroll horizontally through the monthly matrix as needed. Export downloads the currently filtered team movement data.',
  },
];

const MONTHS = [
  { key: 'm_jan', label: 'Jan' }, { key: 'm_feb', label: 'Feb' },
  { key: 'm_mar', label: 'Mar' }, { key: 'm_apr', label: 'Apr' },
  { key: 'm_may', label: 'May' }, { key: 'm_jun', label: 'Jun' },
  { key: 'm_jul', label: 'Jul' }, { key: 'm_aug', label: 'Aug' },
  { key: 'm_sep', label: 'Sep' }, { key: 'm_oct', label: 'Oct' },
  { key: 'm_nov', label: 'Nov' }, { key: 'm_dec', label: 'Dec' },
];

export const TeamMovementReportPage = () => {
  const { year, setYear, teams, loading, error, refetch } =
    useTeamMovement(2026);

  // ─── Filters (unchanged) ───────────────────────────
  const [filterTeam, setFilterTeam] = useState('');
  const [filterMat, setFilterMat] = useState('');
  const [filterDu, setFilterDu] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const availableTeams = useMemo(
    () => teams.map((t) => t.team_code).sort(),
    [teams]
  );
  const availableMats = useMemo(() => {
    const s = new Set(teams.map((t) => t.mat).filter(Boolean));
    return Array.from(s).sort();
  }, [teams]);
  const availableDus = useMemo(() => {
    const s = new Set();
    teams.forEach((t) =>
      Object.values(t.months).forEach((m) => m.du && s.add(m.du))
    );
    return Array.from(s).sort();
  }, [teams]);
  const availableProjects = useMemo(() => {
    const s = new Set();
    teams.forEach((t) =>
      Object.values(t.months).forEach((m) => m.project && s.add(m.project))
    );
    return Array.from(s).sort();
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (filterTeam && t.team_code !== filterTeam) return false;
      if (filterMat && t.mat !== filterMat) return false;
      if (filterDu) {
        if (!Object.values(t.months).some((m) => m.du === filterDu)) return false;
      }
      if (filterProject) {
        if (!Object.values(t.months).some((m) => m.project === filterProject)) return false;
      }
      if (filterMonth && !t.months[filterMonth]) return false;
      return true;
    });
  }, [teams, filterTeam, filterMat, filterDu, filterProject, filterMonth]);

  const hasActiveFilters =
    filterTeam || filterMat || filterDu || filterProject || filterMonth;

  const clearFilters = () => {
    setFilterTeam(''); setFilterMat(''); setFilterDu('');
    setFilterProject(''); setFilterMonth('');
  };

  // ─── Export (unchanged) ────────────────────────────
  const handleExport = async () => {
    const columns = [
      { key: 'index',       label: 'S/N',     align: 'center' },
      { key: 'team_code',   label: 'Team ID' },
      { key: 'mat',         label: 'MAT',     align: 'center' },
      { key: 'staff_count', label: 'Staff',   align: 'center' },
      { key: 'provinces',   label: 'Province' },
    ];
    MONTHS.forEach((m) =>
      columns.push({
        key: `${m.key}_display`,
        label: `${m.label}-${String(year).slice(-2)}`,
        align: 'center',
      })
    );

    const exportRows = filteredTeams.map((t, idx) => {
      const row = {
        index: idx + 1,
        team_code: t.team_code,
        mat: t.mat,
        staff_count: t.staff_count,
        provinces: t.provinces,
      };
      MONTHS.forEach((m) => {
        const cell = t.months[m.key];
        row[`${m.key}_display`] = cell ? `${cell.project} / ${cell.du}` : '';
      });
      return row;
    });

    await exportToExcel(exportRows, columns, `Team_Movement_${year}`, {
      title: `Team Movement Log — ${year}`,
      subtitle: `Generated on ${new Date().toLocaleDateString('en-GB')}`,
      sheetName: `Teams ${year}`,
    });
  };

  if (loading && teams.length === 0) {
    return <div className="loading">Loading team movement...</div>;
  }
  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div className="dashboard">
      <PageHeader>
        <h1>Team Movement Log — {year}</h1>
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
          <button onClick={refetch} className="btn-refresh" disabled={loading}>
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={loading || filteredTeams.length === 0}
          >
            ⬇ Export to Excel
          </button>
        </div>
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help with Team Movement?"
        title="How to use the Team Movement Log"
        intro="Review how team assignments change over time in the monthly movement matrix."
        steps={TUTORIAL_STEPS}
        reminder="The selected year and filters determine which movement data is shown and exported."
      />

      {/* Filters (unchanged) */}
      <div className="table-toolbar">
        <select className="filter-select" value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">All Months</option>
          {MONTHS.map((m) => (
            <option key={m.key} value={m.key}>{m.label} {year}</option>
          ))}
        </select>

        <select className="filter-select" value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}>
          <option value="">All Teams</option>
          {availableTeams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select className="filter-select" value={filterMat}
          onChange={(e) => setFilterMat(e.target.value)}>
          <option value="">All MAT</option>
          {availableMats.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select className="filter-select" value={filterDu}
          onChange={(e) => setFilterDu(e.target.value)}>
          <option value="">All DUs</option>
          {availableDus.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select className="filter-select" value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {availableProjects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button className="btn-reset" onClick={clearFilters}>Clear</button>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <span className="form-hint">
            {filteredTeams.length} of {teams.length} teams
          </span>
        </div>
      </div>

      <TableHorizontalScroll style={{ marginTop: 12 }}>
        {loading && teams.length > 0 && (
          <div className="table-loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <table className="deployments-table pivot-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Team ID</th>
              <th>MAT</th>
              <th>Staff</th>
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
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={5 + MONTHS.length} className="empty-row">
                  {hasActiveFilters
                    ? 'No teams match the current filters.'
                    : `No movement data for ${year}`}
                </td>
              </tr>
            ) : (
              filteredTeams.map((team, idx) => (
                <tr key={team.team_code}>
                  <td>{idx + 1}</td>
                  <td><strong>{team.team_code}</strong></td>
                  <td><span className="badge">{team.mat}</span></td>
                  <td>{team.staff_count}</td>
                  <td>{team.provinces}</td>
                  {MONTHS.map((m) => {
                    const cell = team.months[m.key];
                    const isMonthFilter = filterMonth === m.key;

                    // ── NA cell ──
                    if (!cell) {
                      return (
                        <td
                          key={m.key}
                          className="cell-na"
                          style={{
                            outline: isMonthFilter
                              ? '2px solid #4299e1'
                              : undefined,
                            outlineOffset: '-2px',
                          }}
                        >
                          NA
                        </td>
                      );
                    }

                    // ── Plain cell: project stacked over DU ──
                    const projectHighlighted =
                      filterProject && cell.project === filterProject;

                    return (
                      <td
                        key={m.key}
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          lineHeight: 1.25,
                          textAlign: 'center',
                          outline: isMonthFilter
                            ? '2px solid #4299e1'
                            : undefined,
                          outlineOffset: '-2px',
                          boxShadow: projectHighlighted
                            ? 'inset 0 0 0 2px #f6e05e'
                            : undefined,
                        }}
                        title={`${cell.project} · ${cell.du}`}
                      >
                        <div>{cell.project}</div>
                        <div style={{ fontSize: 10, color: '#718096' }}>
                          {cell.du}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableHorizontalScroll>
    </div>
  );
};