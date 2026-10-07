import { useState, useEffect, useCallback } from 'react';
import { teamModel } from '../models/teamModel';
import { duModel } from '../models/duModel';

export const useTeamsController = () => {
  const [teams, setTeams] = useState([]);
  const [dus, setDus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsData, dusData] = await Promise.all([
        teamModel.getAll(),
        duModel.getAll(),
      ]);
      setTeams(teamsData);
      setDus(dusData);
    } catch (err) {
      console.error('Teams fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createTeam = useCallback(async (data) => {
    setSaving(true);
    setError(null);
    try {
      const result = await teamModel.create(data);
      await fetchAll();
      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const updateTeam = useCallback(async (id, data) => {
    setSaving(true);
    setError(null);
    try {
      const result = await teamModel.update(id, data);
      await fetchAll();
      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const deleteTeam = useCallback(async (id) => {
    setSaving(true);
    setError(null);
    try {
      await teamModel.delete(id);
      await fetchAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  return {
    teams,
    dus,
    loading,
    saving,
    error,
    refetch: fetchAll,
    createTeam,
    updateTeam,
    deleteTeam,
  };
};