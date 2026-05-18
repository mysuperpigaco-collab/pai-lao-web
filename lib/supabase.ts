import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client (ใช้ใน API routes — ข้าม RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceKey);

// Public client (ใช้ใน browser — อ่านข้อมูลสาธารณะ)
export const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
