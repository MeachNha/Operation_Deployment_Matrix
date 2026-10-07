import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { deploymentModel } from '../../models/deploymentModel';
import { duModel } from '../../models/duModel';
import { exportToExcel } from '../../utils/exportToExcel';

export const DuReportPage = () => {
  const [rows, setRows] = useState([]);
  const [dus, setDus] = useState([]);
  const [selectedDu, setSelectedDu] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch the DU report ────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getDuReport();
      setRows(data || []);
    } catch (err) {
      console.error('DU report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch the DU list once ─────────────────────────
  useEffect(() => {
    async function loadDus() {
      try {
        const list = await duModel.getAll();
        setDus(list || []);
      } catch (err) {
        console.error('Load DUs error:', err);
      }
    }
    loadDus();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─── Filter rows by selected DU ─────────────────────
  const filteredRows = useMemo(() => {
    if (!selectedDu) return rows;
    return rows.filter((r) => r.du_code === selectedDu);
  }, [rows, selectedDu]);

  // ─── Compute totals ─────────────────────────────────
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => ({
        teams: acc.teams + Number(row.active_teams || 0),
        staff: acc.staff + Number(row.total_staff || 0),
      }),
      { teams: 0, staff: 0 }
    );
  }, [filteredRows]);

  const activeDuCount = filteredRows.filter(
    (r) => Number(r.active_teams) > 0
  ).length;

  // ─── Export ─────────────────────────────────────────
  const handleExport = async () => {
    const columns = [
      { key: 'index',        label: 'S/N',          align: 'center' },
      { key: 'du_code',      label: 'DU Code',      align: 'center' },
      { key: 'du_name',      label: 'DU Name' },
      { key: 'active_teams', label: 'Active Teams', align: 'center' },
      { key: 'total_staff',  label: 'Total Staff',  align: 'center' },
      { key: 'projects',     label: 'Projects' },
      { key: 'provinces',    label: 'Provinces' },
    ];

    const exportRows = filteredRows.map((r, idx) => ({
      ...r,
      index: idx + 1,
    }));

    const suffix = selectedDu ? `_${selectedDu}` : '';

    await exportToExcel(exportRows, columns, `DU_Report${suffix}`, {
      title: `DU Staffing Report${selectedDu ? ` — ${selectedDu}` : ''}`,
      subtitle: `Generated on ${new Date().toLocaleDateString('en-GB')}`,
      sheetName: 'DU Report',
    });
  };

  if (loading && rows.length === 0) {
    return <div className="loading">Loading DU report...</div>;
  }

  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>DU Staffing Report</h1>
          <p className="report-subtitle">
            {filteredRows.length} DU{filteredRows.length === 1 ? '' : 's'}
            {selectedDu && ` — filtered to ${selectedDu}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedDu}
            onChange={(e) => setSelectedDu(e.target.value)}
            className="filter-select"
            disabled={loading}
            style={{ minWidth: 160 }}
          >
            <option value="">All DUs</option>
            {dus.map((d) => (
              <option key={d.id} value={d.code}>
                {d.code}
              </option>
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
      </header>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{filteredRows.length}</span>
          <span className="stat-label">Total DUs</span>
        </div>
        <div className="stat-card active">
          <span className="stat-value">{activeDuCount}</span>
          <span className="stat-label">Active DUs</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.teams}</span>
          <span className="stat-label">Teams Deployed</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-value">{totals.staff}</span>
          <span className="stat-label">Total Staff</span>
        </div>
      </div>

      {/* Table */}
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
              <th>DU Code</th>
              <th>DU Name</th>
              <th style={{ textAlign: 'center' }}>Active Teams</th>
              <th style={{ textAlign: 'center' }}>Total Staff</th>
              <th>Projects</th>
              <th>Provinces</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  {selectedDu
                    ? `No data for DU ${selectedDu}`
                    : 'No DU data available.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.du_code}>
                  <td>{idx + 1}</td>
                  <td><strong>{row.du_code}</strong></td>
                  <td>{row.du_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${
                        Number(row.active_teams) > 0
                          ? 'badge-active'
                          : 'badge-idle'
                      }`}
                    >
                      {row.active_teams}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{row.total_staff}</strong>
                  </td>
                  <td>{row.projects}</td>
                  <td>{row.provinces}</td>
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
                <td style={{ textAlign: 'center' }}>
                  <strong>{totals.teams}</strong>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <strong>{totals.staff}</strong>
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};