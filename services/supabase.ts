import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xfnrffojpaecvlsiqfey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmbnJmZm9qcGFlY3Zsc2lxZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODc3ODQsImV4cCI6MjA4MzE2Mzc4NH0.-Eyoam8ONbrfF9XmCGH9_jDdpq7M9PPnNSsATLUyaUk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);