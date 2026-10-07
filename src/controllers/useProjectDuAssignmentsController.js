import { useState, useEffect, useCallback } from 'react';
import { projectDuAssignmentModel } from '../models/projectDuAssignmentModel';
import { duModel } from '../models/duModel';

export const useProjectDuAssignmentsController = () => {
  const [assignments, setAssignments] = useState([]);
  const [dus, setDus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignData, dusData] = await Promise.all([
        projectDuAssignmentModel.getAll(),
        duModel.getAll(),
      ]);
      setAssignments(assignData);
      setDus(dusData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createAssignment = useCallback(async (data) => {
    setSaving(true);
    try {
      await projectDuAssignmentModel.create(data);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const updateAssignment = useCallback(async (id, data) => {
    setSaving(true);
    try {
      await projectDuAssignmentModel.update(id, data);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const endAssignment = useCallback(async (id, endDate, remarks = null) => {
    setSaving(true);
    try {
      await projectDuAssignmentModel.endAssignment(id, endDate, remarks);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const deleteAssignment = useCallback(async (id) => {
    setSaving(true);
    try {
      await projectDuAssignmentModel.delete(id);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  return {
    assignments,
    dus,
    loading,
    saving,
    error,
    refetch: fetchAll,
    createAssignment,
    updateAssignment,
    endAssignment,
    deleteAssignment,
  };
};