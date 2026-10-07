import { supabase } from '../config/supabaseClient';

export const projectModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('code');
    if (error) throw error;
    return data;
  },

  async create(p) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        code: p.code,
        name: p.name,
        contract_start_date: p.contract_start_date,
        contract_end_date: p.contract_end_date,
        status: p.status || 'active',
        remarks: p.remarks || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, p) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        code: p.code,
        name: p.name,
        contract_start_date: p.contract_start_date,
        contract_end_date: p.contract_end_date,
        status: p.status,
        remarks: p.remarks || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};