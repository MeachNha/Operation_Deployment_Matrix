import { supabase } from '../config/supabaseClient';

export const duModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('dus')
      .select('*')
      .order('code');
    if (error) throw error;
    return data;
  },

  async create(d) {
    const { data, error } = await supabase
      .from('dus')
      .insert([{ code: d.code, name: d.name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, d) {
    const { data, error } = await supabase
      .from('dus')
      .update({ code: d.code, name: d.name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('dus').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};