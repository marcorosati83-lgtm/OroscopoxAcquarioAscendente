import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nsvslecczhduameqmukt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wNOPun4Bm7LIDRdPc0UX_g_pD3ZiMx2";

export async function saveCalculation(data) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
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
