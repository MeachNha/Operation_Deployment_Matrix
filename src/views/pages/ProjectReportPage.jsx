import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { TableHorizontalScroll } from '../components/shared/TableHorizontalScroll';
import { ScreenTutorial } from '../components/shared/ScreenTutorial';
import { deploymentModel } from '../../models/deploymentModel';
import { projectModel } from '../../models/projectModel';
import { exportToExcel } from '../../utils/exportToExcel';

const TUTORIAL_STEPS = [
  {
    title: 'Select a project and year',
    description: 'Use the project selector to focus on one project, or leave All Projects selected. Choose the year you want to review.',
  },
  {
    title: 'Read the monthly matrix',
    description: 'Review the monthly deployment values in the table for each team and project assignment.',
  },
  {
    title: 'Refresh or export',
    description: 'Refresh the report after changing the selection, or export the currently selected project and year to Excel.',
  },
];

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

export const ProjectReportPage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedProject, setSelectedProject] = useState('');
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getProjectMonthlyReport(year);
      setRows(data || []);
    } catch (err) {
      console.error('Project report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const list = await projectModel.getAll();
        setProjects(list || []);
      } catch (err) {
        console.error('Load projects error:', err);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    if (!selectedProject) return rows;
    return rows.filter((r) => r.project_code === selectedProject);
  }, [rows, selectedProject]);

  const totals = useMemo(() => {
    return MONTHS.reduce((acc, m) => {
      acc[m.key] = filteredRows.reduce(
        (sum, r) => sum + Number(r[m.key] || 0),
        0
      );
      return acc;
    }, {});
  }, [filteredRows]);

  const handleExport = async () => {
    const columns = [
      { key: 'index',        label: 'No.',          align: 'center' },
      { key: 'project_code', label: 'Project Code', align: 'center' },
      { key: 'project_name', label: 'Project Name' },
    ];

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthKeys = ['m_jan', 'm_feb', 'm_mar', 'm_apr', 'm_may', 'm_jun',
                       'm_jul', 'm_aug', 'm_sep', 'm_oct', 'm_nov', 'm_dec'];
    monthKeys.forEach((key, i) => {
      columns.push({
        key,
        label: `${monthLabels[i]}-${String(year).slice(-2)}`,
        align: 'center',
      });
    });

    const exportRows = filteredRows.map((r, idx) => ({
      ...r,
      index: idx + 1,
    }));

    const suffix = selectedProject ? `_${selectedProject}` : '';

    await exportToExcel(
      exportRows,
      columns,
      `Project_Report_${year}${suffix}`,
      {
        title: `Project Deployment Report — ${year}${
          selectedProject ? ` · ${selectedProject}` : ''
        }`,
        subtitle: `Distinct teams deployed per project per month · Generated on ${new Date().toLocaleDateString('en-GB')}`,
        sheetName: `Project ${year}`,
      }
    );
  };

  if (loading && rows.length === 0) {
    return <div className="loading">Loading project report...</div>;
  }

  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div className="dashboard">
      <PageHeader>
        <h1>Project Report — {year}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="filter-select"
            disabled={loading}
            style={{ minWidth: 180 }}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

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
            onClick={fetchReport}
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
      </PageHeader>

      <ScreenTutorial
        tipTitle="Need help with the project report?"
        title="How to use the Project Report"
        intro="Explore deployment activity by project and year in the monthly report matrix."
        steps={TUTORIAL_STEPS}
        reminder="Check both selectors before exporting so the downloaded report matches your review."
      />

      <TableHorizontalScroll>
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
              <th>PROJECT</th>
              {MONTHS.map((m) => (
                <th key={m.key}>
                  {m.label}-{String(year).slice(-2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={3 + MONTHS.length} className="empty-row">
                  {selectedProject
                    ? `No data for project ${selectedProject} in ${year}`
                    : `No project data for ${year}`}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.project_code}>
                  <td>{idx + 1}</td>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{row.project_code}</strong>
                  </td>
                  {MONTHS.map((m) => (
                    <td
                      key={m.key}
                      className={
                        Number(row[m.key]) === 0
                          ? 'cell-na'
                          : 'cell-project'
                      }
                    >
                      {row[m.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="totals-row">
                <td colSpan="3" style={{ textAlign: 'right' }}>
                  <strong>Totals</strong>
                </td>
                {MONTHS.map((m) => (
                  <td key={m.key} style={{ textAlign: 'center' }}>
                    <strong>{totals[m.key]}</strong>
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </TableHorizontalScroll>
    </div>
  );
};