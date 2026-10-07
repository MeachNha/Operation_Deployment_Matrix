import { useState, useEffect, useCallback } from 'react';
import { projectModel } from '../models/projectModel';

export const useProjectsController = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectModel.getAll();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createProject = useCallback(async (data) => {
    setSaving(true);
    try {
      await projectModel.create(data);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const updateProject = useCallback(async (id, data) => {
    setSaving(true);
    try {
      await projectModel.update(id, data);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const deleteProject = useCallback(async (id) => {
    setSaving(true);
    try {
      await projectModel.delete(id);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  return { projects, loading, saving, error, refetch: fetchAll, createProject, updateProject, deleteProject };
};