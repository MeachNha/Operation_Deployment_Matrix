import { useState, useEffect, useCallback, useMemo } from 'react';
import { deploymentModel } from '../models/deploymentModel';

export const MONTH_KEYS = [
  'm_jan','m_feb','m_mar','m_apr','m_may','m_jun',
  'm_jul','m_aug','m_sep','m_oct','m_nov','m_dec',
];

/**
 * Pivot rows -> one entry per team, with a per-month
 * { project, du } map. If a team has multiple rows covering
 * the same month (shouldn't happen, but be defensive), the
 * first non-NA wins.
 */
function pivotByTeam(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const team = row.team_code;
    if (!team) return;

    if (!map.has(team)) {
      map.set(team, {
        team_code: team,
        mat: row.mat,
        staff_count: row.staff_count,
        provinces: row.provinces,
        months: {}, // { m_jan: { project, du }, ... }
      });
    }
    const entry = map.get(team);

    MONTH_KEYS.forEach((key) => {
      const project = row[key];
      if (!project || project === 'NA') return;

      // First non-NA wins for that month
      if (!entry.months[key]) {
        entry.months[key] = { project, du: row.du_code };
      }
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.team_code.localeCompare(b.team_code)
  );
}

export const useTeamMovement = (initialYear = new Date().getFullYear()) => {
  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getMonthlyReport(year);
      setRows(data);
    } catch (err) {
      console.error('Team movement error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const teams = useMemo(() => pivotByTeam(rows), [rows]);

  return { year, setYear, rows, teams, loading, error, refetch: fetchReport };
};