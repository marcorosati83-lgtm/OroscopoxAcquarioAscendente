import { createClient } from "@supabase/supabase-js";

export async function saveCalculation(data) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase non configurato: il profilo non verrà salvato.");
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("calculations").insert(data);
  return error || null;
}
