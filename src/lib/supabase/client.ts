import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://laspo.asgardpy.click');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM1Njg5NjAwLCJleHAiOjIwNTEyMjI0MDB9.SpugvR8mmGkW2P00TZ7qr4dakiWXYE7xIMjJbwi17A0';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
