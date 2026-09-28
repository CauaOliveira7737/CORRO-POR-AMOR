import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '@corro-por-amor/shared';

export const supabase = createClient(
  APP_CONFIG.supabaseUrl,
  APP_CONFIG.supabaseAnonKey
);
