import { supabase } from './client';

/**
 * Client-Side Supabase Client Reference.
 *
 * NOTE: Service-role keys must NEVER be bundled into frontend client applications.
 * All operations executed from the browser are authenticated and governed via
 * Supabase Row Level Security (RLS) using the standard client.
 */
export const supabaseAdmin = supabase;
