import { supabase } from '../config/supabaseClient';

export const deploymentModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('team_deployments')
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

  async create(d) {
    const { data, error } = await supabase
      .from('team_deployments')
      .insert([{
        team_id: d.team_id,
        assigned_du_id: d.assigned_du_id,
        project_id: d.project_id,
        province: d.province || null,
        start_deploy: d.start_deploy,
        plan_end_deploy: d.plan_end_deploy || null,
        end_deploy: null,                // ← always NULL on create
        status: 'active',                // ← always active on create
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
    .from('team_deployments')
    .update({
      assigned_du_id: d.assigned_du_id,
      project_id: d.project_id,
      province: d.province || null,
      start_deploy: d.start_deploy,
      plan_end_deploy: d.plan_end_deploy || null,      // ← MUST BE HERE
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
      .from('team_deployments')
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
      .from('team_deployments')
      .select('remarks')
      .eq('id', id)
      .single();

    const cancelNote = `CANCELLED (${endDate}): ${reason}`;
    const newRemarks = current?.remarks
      ? `${current.remarks}\n${cancelNote}`
      : cancelNote;

    const { data, error } = await supabase
      .from('team_deployments')
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
      .from('team_deployments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

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
};