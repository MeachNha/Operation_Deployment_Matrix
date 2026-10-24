import React, { useMemo } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { useToolPrivateReport } from '../../controllers/useToolPrivateReport';
import { exportToExcel } from '../../utils/exportToExcel';

const TUTORIAL_STEPS = [
  {
    title: 'Choose the reporting year',
    description: 'Select a year to view its tool-private deployment data.',
  },
  {
    title: 'Compare teams and DUs',
    description: 'Read each team row across the DU columns to review recorded tool-private counts; use Grand Total for the row total.',
  },
  {
    title: 'Refresh or export',
    description: 'Refresh to reload the selected year, or export the matrix to Excel.',
  },
];

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

export const ToolPrivateReportPage = () => {
  const { year, setYear, rows, loading, error, refetch } =
    useToolPrivateReport(2026);

  // ─── Group rows: MAT → its teams ────────────────────
  const grouped = useMemo(() => {
    const matRows = rows.filter((r) => r.out_row_level === 'mat');
    const teamRows = rows.filter((r) => r.out_row_level === 'team');
    const grandTotal = rows.find((r) => r.out_row_level === 'grand_total');

    const teamsByMat = {};
    teamRows.forEach((t) => {
      if (!teamsByMat[t.out_mat_code]) teamsByMat[t.out_mat_code] = [];
      teamsByMat[t.out_mat_code].push(t);
    });

    return { matRows, teamsByMat, grandTotal };
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
          : r.out_row_level === 'mat'
          ? r.out_mat_code
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

    await exportToExcel(exportRows, columns, `Tool_Private_${year}`, {
      title: `Tool-Private Report — ${year}`,
      subtitle: `Team × DU count matrix · Generated on ${new Date().toLocaleDateString('en-GB')}`,
      sheetName: `Tool ${year}`,
    });
  };

  // ─── Loading / Error ────────────────────────────────
  if (loading && rows.length === 0) {
    return <div className="loading">Loading tool-private report...</div>;
  }

  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div className="dashboard">
      <PageHeader>
        <div>
          <h1>Tool-Private Report — {year}</h1>
          <p className="report-subtitle">
            Team × DU count matrix · {rows.length} rows
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
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help with the private report?"
        title="How to use the Tool-Private Report"
        intro="This matrix summarizes tool-private deployment counts for teams across demining units."
        steps={TUTORIAL_STEPS}
        reminder="Use the horizontal table scroll when needed to see all DU columns."
      />

      <TableHorizontalScroll>
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
            {grouped.matRows.length === 0 ? (
              <tr>
                <td colSpan={DU_COLUMNS.length + 2} className="empty-row">
                  No data for {year}. Try a different year.
                </td>
              </tr>
            ) : (
              grouped.matRows.map((matRow) => (
                <React.Fragment key={`mat-${matRow.out_mat_code}`}>
                  {/* MAT subtotal row */}
                  <tr className="row-mat">
                    <td>
                      <strong>{matRow.out_mat_code}</strong>
                    </td>
                    {DU_COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        style={{ textAlign: 'center', fontWeight: 700 }}
                      >
                        {matRow[c.key] || ''}
                      </td>
                    ))}
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        backgroundColor: '#edf2f7',
                      }}
                    >
                      {matRow.out_row_total}
                    </td>
                  </tr>

                  {/* Team rows under this MAT */}
                  {(grouped.teamsByMat[matRow.out_mat_code] || []).map((teamRow) => (
                    <tr key={`team-${teamRow.out_team_code}`}>
                      <td style={{ paddingLeft: 32 }}>{teamRow.out_team_code}</td>
                      {DU_COLUMNS.map((c) => (
                        <td key={c.key} style={{ textAlign: 'center' }}>
                          {teamRow[c.key] || ''}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        {teamRow.out_row_total}
                      </td>
                    </tr>
                  ))}
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
      </TableHorizontalScroll>
    </div>
  );
};