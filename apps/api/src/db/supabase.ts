import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = (process.env.SUPABASE_URL ?? '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Thieu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Xem apps/api/.env.example.',
    );
  }
  return { url, serviceRoleKey };
}

export function isSupabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseAdmin(): SupabaseClient {
  const config = getSupabaseConfig();
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
