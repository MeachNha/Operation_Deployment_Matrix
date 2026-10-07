import { useState, useEffect, useCallback, useMemo } from 'react';
import { deploymentModel } from '../models/deploymentModel';
import { teamModel } from '../models/teamModel';
import { duModel } from '../models/duModel';
import { projectModel } from '../models/projectModel';

export const useMatrixController = () => {
  const [deployments, setDeployments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [dus, setDus] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    duCode: '',
    projectCode: '',
    materialType: '',
    province: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deploymentsData, teamsData, dusData, projectsData] = await Promise.all([
        deploymentModel.getAll(),
        teamModel.getAll(),
        duModel.getAll(),
        projectModel.getAll(),
      ]);
      setDeployments(deploymentsData);
      setTeams(teamsData);
      setDus(dusData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesDu = !filters.duCode || d.assigned_du?.code === filters.duCode;
      const matchesProject = !filters.projectCode || d.project?.code === filters.projectCode;
      const matchesMaterial = !filters.materialType || d.team?.mat === filters.materialType;
      const matchesProvince =
        !filters.province ||
        (d.province || '').toLowerCase().includes(filters.province.toLowerCase());

      const matchesStatus = !filters.status || d.status === filters.status;

      const matchesFrom =
        !filters.dateFrom || new Date(d.start_deploy) >= new Date(filters.dateFrom);
      const matchesTo =
        !filters.dateTo || !d.end_deploy || new Date(d.end_deploy) <= new Date(filters.dateTo);

      return (
        matchesDu &&
        matchesProject &&
        matchesMaterial &&
        matchesProvince &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [deployments, filters]);

  const stats = useMemo(() => {
    const active = filteredDeployments.filter((d) => d.status === 'active');
    const completed = filteredDeployments.filter((d) => d.status === 'completed');
    const cancelled = filteredDeployments.filter((d) => d.status === 'cancelled');
    const totalStaff = active.reduce((sum, d) => sum + (d.team?.staff_count || 0), 0);

    return {
      totalDeployments: filteredDeployments.length,
      activeDeployments: active.length,
      completedDeployments: completed.length,
      cancelledDeployments: cancelled.length,
      totalActiveStaff: totalStaff,
      activeTeams: new Set(active.map((d) => d.team_id)).size,
      projectsCovered: new Set(filteredDeployments.map((d) => d.project_id)).size,
    };
  }, [filteredDeployments]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      duCode: '',
      projectCode: '',
      materialType: '',
      province: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    });
  }, []);

  const createDeployment = useCallback(async (data) => {
    try {
      const result = await deploymentModel.create(data);
      await fetchAll();
      return { success: true, data: result };
    } catch (err) {
      console.error('Create error:', err);
      return { success: false, error: err.message };
    }
  }, [fetchAll]);

  const updateDeployment = useCallback(async (id, updates) => {
    try {
      const result = await deploymentModel.update(id, updates);
      await fetchAll();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchAll]);

  const endDeployment = useCallback(async (id, endDate, remarks = null) => {
    try {
      await deploymentModel.endDeployment(id, endDate, remarks);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchAll]);

  const cancelDeployment = useCallback(async (id, endDate, reason) => {
    try {
      await deploymentModel.cancelDeployment(id, endDate, reason);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchAll]);

  return {
    deployments: filteredDeployments,
    allDeployments: deployments,
    teams,
    dus,
    projects,
    loading,
    error,
    stats,
    filters,
    updateFilter,
    resetFilters,
    refetch: fetchAll,
    createDeployment,
    updateDeployment,
    endDeployment,
    cancelDeployment,
  };
};