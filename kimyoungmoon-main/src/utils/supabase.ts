import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API Key를 가져옵니다.
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): url is string => {
  return typeof url === 'string' && url.startsWith('http');
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl.trim() : 'https://olrhnnrwjgyyvhqntboi.supabase.co';
const supabaseAnonKey = (rawKey && rawKey.length > 10) ? rawKey.trim() : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scmhubnJ3amd5eXZocW50Ym9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODM2MzEsImV4cCI6MjA4ODU1OTYzMX0.jgPHsET1Q314IdkMV2d8qXO_Xsf6bI8v829I_-Ov3eA';

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
