import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umqqvibfwmqkuqlyonao.supabase.co';
const supabaseAnonKey = 'sb_publishable_FH-Lm3YAx4a2TQbmKKacvg_RxA9L5yp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);