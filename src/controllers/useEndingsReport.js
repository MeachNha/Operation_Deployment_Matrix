import { useState, useEffect, useCallback } from 'react';
import { deploymentModel } from '../models/deploymentModel';

export const useEndingsReport = (initialFrom, initialTo) => {
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!fromDate || !toDate) {
      setRows([]);
      setLoading(false);
      return;
    }

    if (fromDate > toDate) {
      setError('From date must be on or before To date');
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await deploymentModel.getEndingsInRange(fromDate, toDate);
      setRows(data || []);
    } catch (err) {
      console.error('Endings report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    rows,
    loading,
    error,
    refetch: fetchReport,
  };
};