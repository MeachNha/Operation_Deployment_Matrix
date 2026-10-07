import { supabase } from '../config/supabaseClient';

export const teamModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('teams')
      .select(`*, home_du:dus!home_du_id (id, code, name)`)
      .order('team_code');
    if (error) throw error;
    return data;
  },

  async create(t) {
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        team_code: t.team_code,
        mat: t.mat,
        staff_count: t.staff_count,
        home_du_id: t.home_du_id,
        dog_count: t.dog_count || 0,
        alis_count: t.alis_count || 0,
        robot_count: t.robot_count || 0,
        integrated_with: t.integrated_with || null,
        equipment_notes: t.equipment_notes || null,
      }])
      .select(`*, home_du:dus!home_du_id (id, code, name)`)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, t) {
    const { data, error } = await supabase
      .from('teams')
      .update({
        team_code: t.team_code,
        mat: t.mat,
        staff_count: t.staff_count,
        home_du_id: t.home_du_id,
        dog_count: t.dog_count || 0,
        alis_count: t.alis_count || 0,
        robot_count: t.robot_count || 0,
        integrated_with: t.integrated_with || null,
        equipment_notes: t.equipment_notes || null,
      })
      .eq('id', id)
      .select(`*, home_du:dus!home_du_id (id, code, name)`)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};