import { useState, useEffect, useCallback } from 'react';
import { deploymentModel } from '../models/deploymentModel';

export const useDuReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getDuReport();
      setRows(data);
    } catch (err) {
      console.error('DU report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    rows,
    loading,
    error,
    refetch: fetchReport,
  };
};