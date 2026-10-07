import { supabase } from '../config/supabaseClient';

export const projectDuAssignmentModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('project_du_assignments')
      .select(`
        *,
        project:projects!project_id (id, code, name),
        du:dus!du_id (id, code, name)
      `)
      .order('start_assign', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByProject(projectId) {
    const { data, error } = await supabase
      .from('project_du_assignments')
      .select(`
        *,
        du:dus!du_id (id, code, name)
      `)
      .eq('project_id', projectId)
      .order('start_assign');
    if (error) throw error;
    return data;
  },

  async create(a) {
    const { data, error } = await supabase
      .from('project_du_assignments')
      .insert([{
        project_id: a.project_id,
        du_id: a.du_id,
        start_assign: a.start_assign,
        end_assign: a.end_assign || null,
        status: a.end_assign ? 'completed' : 'active',
        province: a.province || null,
        remarks: a.remarks || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, a) {
    const { data, error } = await supabase
      .from('project_du_assignments')
      .update({
        du_id: a.du_id,
        start_assign: a.start_assign,
        end_assign: a.end_assign || null,
        status: a.end_assign ? 'completed' : 'active',
        province: a.province || null,
        remarks: a.remarks || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async endAssignment(id, endDate, remarks = null) {
    const { data, error } = await supabase
      .from('project_du_assignments')
      .update({
        end_assign: endDate,
        status: 'completed',
        remarks: remarks,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('project_du_assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};