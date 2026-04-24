import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ryowhcyydncqvbcimwwf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5b3doY3l5ZG5jcXZiY2ltd3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTY5NjUsImV4cCI6MjA5MjYzMjk2NX0.L4Wgw3jVOlNC8ObGYl6uQJn7jyeYjAt99jwKKZ4ZuZA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
