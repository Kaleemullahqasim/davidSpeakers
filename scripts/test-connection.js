/**
 * Supabase Connection Test Script
 * 
 * Run this script with: node scripts/test-connection.js
 * 
 * This script will test the connection to your Supabase database
 * and verify that the required tables exist.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with anon key for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or anon key in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error connecting to Supabase Auth:', authError);
    } else {
      console.log('✅ Successfully connected to Supabase Auth');
    }
    
    // Test database connection by selecting actual records instead of count
    const tables = ['users', 'evaluations', 'skills', 'scoring_rules'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing table "${table}":`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ Successfully retrieved data from "${table}" table`);
        console.log(`   Sample record:`, data[0]);
      } else {
        console.log(`ℹ️ No records found in "${table}" table, but table exists`);
      }
    }
    
    console.log('\nConnection test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
  }
}

testConnection()
  .catch(console.error)
  .finally(() => process.exit(0));
