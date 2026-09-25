import { createClient } from "@supabase/supabase-js";

export async function saveCalculation(data) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase non configurato: variabili VITE_SUPABASE mancanti nel build.");
    return {
      ok: false,
      code: "MISSING_ENV",
      message: "Variabili Supabase non disponibili nel build Vercel."
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from("calculations").insert(data);

    if (error) {
      console.error("Supabase INSERT error:", error);
      return {
        ok: false,
        code: error.code || "SUPABASE_ERROR",
        message: error.message || "Errore durante il salvataggio."
      };
    }

    return { ok: true, code: null, message: "Profilo salvato correttamente in Supabase." };
  } catch (error) {
    console.error("Supabase connection error:", error);
    return {
      ok: false,
      code: "CLIENT_ERROR",
      message: error?.message || "Errore di collegamento a Supabase."
    };
  }
}
