import { supabase } from '../config/supabaseClient';

const TABLE = 'team_deployments';
const HISTORY_TABLE = 'deployment_history';

export const deploymentModel = {
  // ────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        team:teams!team_id (id, team_code, mat, staff_count),
        assigned_du:dus!assigned_du_id (id, code, name),
        project:projects!project_id (id, code, name)
      `)
      .order('start_deploy', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        team:teams!team_id (id, team_code, mat, staff_count),
        assigned_du:dus!assigned_du_id (id, code, name),
        project:projects!project_id (id, code, name)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // ────────────────────────────────────────────────────
  // CREATE / UPDATE / END / CANCEL / DELETE
  // ────────────────────────────────────────────────────
  async create(d) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{
        team_id: d.team_id,
        assigned_du_id: d.assigned_du_id,
        project_id: d.project_id,
        province: d.province || null,
        start_deploy: d.start_deploy,
        plan_end_deploy: d.plan_end_deploy || null,
        end_deploy: null,                // always NULL on create
        status: 'active',                // always active on create
        ops_letter_ref: d.ops_letter_ref || null,
        remarks: d.remarks || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, d) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        assigned_du_id: d.assigned_du_id,
        project_id: d.project_id,
        province: d.province || null,
        start_deploy: d.start_deploy,
        plan_end_deploy: d.plan_end_deploy || null,
        end_deploy: d.end_deploy || null,
        status: d.status || (d.end_deploy ? 'completed' : 'active'),
        ops_letter_ref: d.ops_letter_ref || null,
        remarks: d.remarks || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async endDeployment(id, endDate, remarks = null) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        end_deploy: endDate,
        status: 'completed',
        remarks: remarks,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancelDeployment(id, endDate, reason) {
    const { data: current } = await supabase
      .from(TABLE)
      .select('remarks')
      .eq('id', id)
      .single();

    const cancelNote = `CANCELLED (${endDate}): ${reason}`;
    const newRemarks = current?.remarks
      ? `${current.remarks}\n${cancelNote}`
      : cancelNote;

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        end_deploy: endDate,
        status: 'cancelled',
        remarks: newRemarks,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // ────────────────────────────────────────────────────
  // TRANSFER (stored procedure — unchanged)
  // ────────────────────────────────────────────────────
  async transferDeployment({
    currentDeploymentId,
    teamId,
    endDeploy,
    endRemarks,
    startDeploy,
    planEndDeploy,
    assignedDuId,
    projectId,
    province,
    opsLetterRef,
    newRemarks,
  }) {
    const { data, error } = await supabase.rpc('transfer_team_deployment', {
      p_current_deployment_id: currentDeploymentId,
      p_team_id: teamId,
      p_end_deploy: endDeploy,
      p_end_remarks: endRemarks,
      p_start_deploy: startDeploy,
      p_plan_end_deploy: planEndDeploy || null,
      p_assigned_du_id: assignedDuId,
      p_project_id: projectId,
      p_province: province,
      p_ops_letter_ref: opsLetterRef,
      p_new_remarks: newRemarks,
    });
    if (error) throw error;
    return data;
  },

  // ────────────────────────────────────────────────────
  // HISTORY TABLE — used for Undo
  // ────────────────────────────────────────────────────

  /**
   * Save a snapshot of the OLD deployment, linked to the NEW deployment.
   * Called immediately after a successful transfer.
   */
  async createHistoryEntry({ deploymentId, previousDeployment }) {
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .insert({
        deployment_id: deploymentId,                  // new deployment
        previous_deployment_id: previousDeployment.id, // old deployment
        team_id: previousDeployment.team_id,
        project_id: previousDeployment.project_id,
        assigned_du_id: previousDeployment.assigned_du_id,
        province: previousDeployment.province,
        ops_letter_ref: previousDeployment.ops_letter_ref,
        remarks: previousDeployment.remarks,
        start_deploy: previousDeployment.start_deploy,
        plan_end_deploy: previousDeployment.plan_end_deploy,
        end_deploy: previousDeployment.end_deploy,
        status: previousDeployment.status,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch the (non-undone) history entry attached to a deployment.
   * Returns null if the deployment was not created by a transfer.
   */
  async getHistoryForDeployment(deploymentId) {
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('*')
      .eq('deployment_id', deploymentId)
      .is('undone_at', null)
      .order('transferred_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Return a Set of deployment IDs that are undoable
   * (i.e. have an active history entry).
   * Used to show/hide the Undo button in the table.
   */
  async getUndoableDeploymentIds() {
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('deployment_id')
      .is('undone_at', null);
    if (error) throw error;
    return new Set((data || []).map((h) => h.deployment_id));
  },

  /**
   * Mark a history entry as undone (audit trail).
   * Only needed if the FK is ON DELETE SET NULL.
   * With ON DELETE CASCADE, the row disappears on delete.
   */
  async markHistoryUndone(historyId) {
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .update({ undone_at: new Date().toISOString() })
      .eq('id', historyId);
    if (error) throw error;
  },

  /**
   * Fallback: find the previous deployment directly from
   * team_deployments — used only if a history row is missing.
   * (Kept for compatibility; the undo path prefers history.)
   */
  async findPreviousDeploymentForTeam(teamId, currentStartDate, currentDeploymentId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('team_id', teamId)
      .neq('id', currentDeploymentId)
      .not('end_deploy', 'is', null)
      .lte('end_deploy', currentStartDate)
      .order('end_deploy', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  // ────────────────────────────────────────────────────
  // REPORTS (unchanged)
  // ────────────────────────────────────────────────────
  async getMonthlyReport(year) {
    const { data, error } = await supabase.rpc('monthly_report', { p_year: year });
    if (error) throw error;
    return data;
  },

  async getDuReport() {
    const { data, error } = await supabase.rpc('du_report');
    if (error) throw error;
    return data;
  },

  async getProjectMonthlyReport(year) {
    const { data, error } = await supabase.rpc('project_monthly_report', { p_year: year });
    if (error) throw error;
    return data;
  },

  async getEndingsInRange(fromDate, toDate) {
    const { data, error } = await supabase.rpc('endings_in_range', {
      p_from: fromDate,
      p_to: toDate,
    });
    if (error) throw error;
    return data;
  },

  async getToolPrivateReport(year) {
    const { data, error } = await supabase
      .rpc('tool_private_report', { p_year: year });
    if (error) throw error;
    return data;
  },

  async getProjectPrivateReport(year) {
    const { data, error } = await supabase
      .rpc('project_private_report', { p_year: year });
    if (error) throw error;
    return data;
  },

  async getTeamMovementReport(year) {
    const { data, error } = await supabase
      .rpc('team_movement_report', { p_year: year });
    if (error) throw error;
    return data;
  },
  async undoTransfer(currentDeploymentId) {
  const { data, error } = await supabase.rpc('undo_team_transfer', {
    p_current_deployment_id: currentDeploymentId,
  });
  if (error) throw error;
  return data;
},
// ────────────────────────────────────────────────────
// STAND OUT TEAMS (stored procedure — unchanged)
// ────────────────────────────────────────────────────
async getStandOutTeams(fromDate, toDate) {
  const { data, error } = await supabase.rpc('stand_out_teams', {
    p_from: fromDate,
    p_to: toDate,
  });
  if (error) throw error;
  return data;
},
};