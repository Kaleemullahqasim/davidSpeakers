/**
 * Toggle Row Level Security (RLS) Script
 * 
 * Run this script with: node scripts/toggle-rls.js disable
 * or: node scripts/toggle-rls.js enable
 * 
 * This script will toggle RLS on all tables in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service role key in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function toggleRLS(action) {
  // Validate action
  if (action !== 'enable' && action !== 'disable') {
    console.error('Invalid action. Use "enable" or "disable"');
    process.exit(1);
  }

  console.log(`${action === 'enable' ? 'Enabling' : 'Disabling'} Row Level Security...`);
  
  // List of tables to modify
  const tables = ['users', 'evaluations', 'skills', 'scoring_rules'];
  
  for (const table of tables) {
    try {
      // Execute raw SQL query
      const { error } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE ${table} ${action === 'enable' ? 'ENABLE' : 'DISABLE'} ROW LEVEL SECURITY;`
      });
      
      if (error) {
        console.error(`❌ Error ${action}ing RLS on "${table}":`, error);
      } else {
        console.log(`✅ Successfully ${action}d RLS on "${table}" table`);
      }
    } catch (error) {
      console.error(`❌ Error executing SQL on "${table}":`, error);
    }
  }
  
  console.log(`\nRLS ${action} operation completed!`);
}

// Get action from command line argument
const action = process.argv[2]?.toLowerCase();
toggleRLS(action);
