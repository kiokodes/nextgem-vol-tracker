import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type Database = {
  orphanages: {
    id: string;
    name: string;
    qr_code_token: string;
    created_at: string;
  };
  volunteers: {
    id: string;
    name: string;
    nysc_code: string;
    orphanage_id: string;
    created_at: string;
  };
  sessions: {
    id: string;
    volunteer_id: string;
    orphanage_id: string;
    check_in_time: string;
    check_out_time: string | null;
    date: string;
    hours: number | null;
    created_at: string;
  };
};
