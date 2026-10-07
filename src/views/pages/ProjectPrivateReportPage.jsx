import React, { useMemo } from 'react';
import { useProjectPrivateReport } from '../../controllers/useProjectPrivateReport';
import { exportToExcel } from '../../utils/exportToExcel';

const DU_COLUMNS = [
  { key: 'out_du_ddu',  label: 'DDU' },
  { key: 'out_du_du1',  label: 'DU1' },
  { key: 'out_du_du2',  label: 'DU2' },
  { key: 'out_du_du3',  label: 'DU3' },
  { key: 'out_du_du4',  label: 'DU4' },
  { key: 'out_du_du5',  label: 'DU5' },
  { key: 'out_du_du6',  label: 'DU6' },
  { key: 'out_du_hq',   label: 'HQ' },
  { key: 'out_du_sdu',  label: 'SDU' },
  { key: 'out_du_tima', label: 'TIMA' },
];

export const ProjectPrivateReportPage = () => {
  const { year, setYear, rows, loading, error, refetch } =
    useProjectPrivateReport(2026);

  // ─── Group rows: Project → its teams ────────────────
  const grouped = useMemo(() => {
    const projectRows = rows.filter((r) => r.out_row_level === 'project');
    const teamRows = rows.filter((r) => r.out_row_level === 'team');
    const grandTotal = rows.find((r) => r.out_row_level === 'grand_total');

    const teamsByProject = {};
    teamRows.forEach((t) => {
      if (!teamsByProject[t.out_project_code]) {
        teamsByProject[t.out_project_code] = [];
      }
      teamsByProject[t.out_project_code].push(t);
    });

    return { projectRows, teamsByProject, grandTotal };
  }, [rows]);

  // ─── Export ─────────────────────────────────────────
  const handleExport = async () => {
    const columns = [
      { key: 'label', label: 'Row Labels' },
      ...DU_COLUMNS.map((c) => ({ key: c.key, label: c.label, align: 'center' })),
      { key: 'out_row_total', label: 'Grand Total', align: 'center' },
    ];

    const exportRows = rows.map((r) => {
      const label =
        r.out_row_level === 'grand_total'
          ? 'Grand Total'
          : r.out_row_level === 'project'
          ? r.out_project_code
          : r.out_team_code;

      return {
        label,
        out_du_ddu: r.out_du_ddu || '',
        out_du_du1: r.out_du_du1 || '',
        out_du_du2: r.out_du_du2 || '',
        out_du_du3: r.out_du_du3 || '',
        out_du_du4: r.out_du_du4 || '',
        out_du_du5: r.out_du_du5 || '',
        out_du_du6: r.out_du_du6 || '',
        out_du_hq:  r.out_du_hq  || '',
        out_du_sdu: r.out_du_sdu || '',
        out_du_tima:r.out_du_tima|| '',
        out_row_total: r.out_row_total,
      };
    });

    await exportToExcel(exportRows, columns, `Project_Private_${year}`, {
      title: `Project-Private Report — ${year}`,
      subtitle: `Project × DU count matrix · Generated on ${new Date().toLocaleDateString('en-GB')}`,
      sheetName: `Project ${year}`,
    });
  };

  if (loading && rows.length === 0) {
    return <div className="loading">Loading project-private report...</div>;
  }

  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Project-Private Report — {year}</h1>
          <p className="report-subtitle">
            Project × DU count matrix · {rows.length} rows
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            className="filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={loading}
            style={{ minWidth: 120, fontWeight: 700 }}
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={loading || rows.length === 0}
          >
            ⬇ Export to Excel
          </button>
          <button onClick={refetch} className="btn-refresh" disabled={loading}>
            {loading ? '⏳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </header>

      <div className="table-container" style={{ position: 'relative' }}>
        {loading && rows.length > 0 && (
          <div className="table-loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <table className="deployments-table pivot-table tool-private-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 240 }}>Row Labels</th>
              {DU_COLUMNS.map((c) => (
                <th key={c.key} style={{ textAlign: 'center' }}>
                  {c.label}
                </th>
              ))}
              <th style={{ textAlign: 'center', fontWeight: 700 }}>
                Grand Total
              </th>
            </tr>
          </thead>
          <tbody>
            {grouped.projectRows.length === 0 ? (
              <tr>
                <td colSpan={DU_COLUMNS.length + 2} className="empty-row">
                  No data for {year}. Try a different year.
                </td>
              </tr>
            ) : (
              grouped.projectRows.map((projectRow) => (
                <React.Fragment key={`proj-${projectRow.out_project_code}`}>
                  {/* Project subtotal row */}
                  <tr className="row-mat">
                    <td>
                      <strong>{projectRow.out_project_code}</strong>
                    </td>
                    {DU_COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        style={{ textAlign: 'center', fontWeight: 700 }}
                      >
                        {projectRow[c.key] || ''}
                      </td>
                    ))}
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        backgroundColor: '#edf2f7',
                      }}
                    >
                      {projectRow.out_row_total}
                    </td>
                  </tr>

                  {/* Team rows under this project */}
                  {(grouped.teamsByProject[projectRow.out_project_code] || []).map(
                    (teamRow) => (
                      <tr key={`team-${projectRow.out_project_code}-${teamRow.out_team_code}`}>
                        <td style={{ paddingLeft: 32 }}>
                          {teamRow.out_team_code}
                        </td>
                        {DU_COLUMNS.map((c) => (
                          <td key={c.key} style={{ textAlign: 'center' }}>
                            {teamRow[c.key] || ''}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          {teamRow.out_row_total}
                        </td>
                      </tr>
                    )
                  )}
                </React.Fragment>
              ))
            )}

            {/* Grand total row */}
            {grouped.grandTotal && (
              <tr className="totals-row">
                <td>
                  <strong>Grand Total</strong>
                </td>
                {DU_COLUMNS.map((c) => (
                  <td key={c.key} style={{ textAlign: 'center' }}>
                    <strong>{grouped.grandTotal[c.key] || ''}</strong>
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                  <strong>{grouped.grandTotal.out_row_total}</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};