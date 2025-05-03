import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Coba membaca langsung dari file .env sebagai fallback
let supabaseUrlFromFile, supabaseKeyFromFile;
try {
  const envPath = resolve(dirname(__dirname), '.env');
  console.log(`Checking for .env file at: ${envPath}`);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    
    if (urlMatch && urlMatch[1]) supabaseUrlFromFile = urlMatch[1].trim();
    if (keyMatch && keyMatch[1]) supabaseKeyFromFile = keyMatch[1].trim();
    
    console.log('URL from file:', supabaseUrlFromFile ? 'Found' : 'Not found');
    console.log('Key from file:', supabaseKeyFromFile ? 'Found' : 'Not found');
  } else {
    console.log('.env file not found at this location');
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

// Coba dengan prefiks NEXT_PUBLIC_ dan juga tanpa prefiks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.SUPABASE_URL || 
                   supabaseUrlFromFile || 
                   'https://xdjiovxkvfgkjpwlyhya.supabase.co'; // Fallback hardcoded

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                       process.env.SUPABASE_ANON_KEY || 
                       supabaseKeyFromFile || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkamlvdnhrdmZna2pwd2x5aHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMDYxMzQsImV4cCI6MjA1OTg4MjEzNH0._HWmyyKrJ33_ITbUMIL8e1Ga-CiC9X3f82GocBAXPi0'; // Fallback hardcoded

console.log('Final Supabase URL:', supabaseUrl);
console.log('Final Supabase Anon Key:', supabaseAnonKey ? '[Loaded]' : '[Missing]');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 