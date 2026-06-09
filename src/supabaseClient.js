import { createClient } from '@supabase/supabase-js'

// REPLACE these strings with your actual values from the Supabase Dashboard
const supabaseUrl = 'https://xyz-your-project-id.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)