// Supabase
const SUPABASE_URL = 'https://kqurmihyfgbdhtukqnzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdXJtaWh5ZmdiZGh0dWtxbnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc5ODEsImV4cCI6MjA5Mzk3Mzk4MX0.ttVpNhXC3HKsMiE6rqbWqwNq3AkSPG11RnVGRtUyQEo';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Google OAuth
const GOOGLE_CLIENT_ID = '1058193356428-i456aefehe25rshdo87rlmgsraqr5om4.apps.googleusercontent.com';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// App settings
const APP_NAME = '상담 아카이브';
const DRIVE_FOLDER_NAME = '상담 아카이브';
