import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezdxyxmgbyzfbqkxpthu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZHh5eG1nYnl6ZmJxa3hwdGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjExNjAsImV4cCI6MjA5MTEzNzE2MH0.L-aQdJaA-hgPtO5uG_nSx9dSDDGU48lTqP0jxHIWzU4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});