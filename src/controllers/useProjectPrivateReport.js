import { useState, useEffect, useCallback } from 'react';
import { deploymentModel } from '../models/deploymentModel';

export const useProjectPrivateReport = (initialYear = new Date().getFullYear()) => {
  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getProjectPrivateReport(year);
      setRows(data || []);
    } catch (err) {
      console.error('Project-private report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    year,
    setYear,
    rows,
    loading,
    error,
    refetch: fetchReport,
  };
};