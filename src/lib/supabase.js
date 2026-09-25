import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nsvslecczhduameqmukt.supabase.co";

export async function saveCalculation(data) {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    console.warn("Supabase non configurato: VITE_SUPABASE_ANON_KEY mancante nel build.");
    return {
      ok: false,
      code: "MISSING_KEY",
      message: "Chiave Supabase non disponibile nel build Vercel."
    };
  }

  try {
    const supabase = createClient(SUPABASE_URL, supabaseAnonKey);
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
