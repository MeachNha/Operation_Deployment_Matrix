import { useState, useEffect, useCallback } from 'react';
import { duModel } from '../models/duModel';

export const useDusController = () => {
  const [dus, setDus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await duModel.getAll();
      setDus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createDu = useCallback(async (data) => {
    setSaving(true);
    try {
      await duModel.create(data);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const updateDu = useCallback(async (id, data) => {
    setSaving(true);
    try {
      await duModel.update(id, data);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const deleteDu = useCallback(async (id) => {
    setSaving(true);
    try {
      await duModel.delete(id);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  return { dus, loading, saving, error, refetch: fetchAll, createDu, updateDu, deleteDu };
};