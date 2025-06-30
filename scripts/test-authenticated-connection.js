/**
 * Supabase Authenticated Connection Test Script
 * 
 * Run this script with: node scripts/test-authenticated-connection.js
 * 
 * This script will test the connection to your Supabase database
 * with authentication using the admin account.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service role key in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthenticatedConnection() {
  console.log('Testing Supabase connection with service role key...');
  
  try {
    // Test database connection by checking for tables
    const tables = ['users', 'evaluations', 'skills', 'scoring_rules'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error accessing table "${table}":`, error);
      } else {
        console.log(`✅ Successfully connected to table "${table}"`);
        console.log(`   Records in table: ${data.count}`);
      }
    }
    
    // Get admin credentials
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminError) {
      console.error('❌ Error fetching admin user:', adminError);
    } else if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Admin user found:', adminUsers[0].email);
      
      // Attempt to sign in with admin credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@davidspeaker.com',
        password: 'admin123'
      });
      
      if (authError) {
        console.error('❌ Error signing in as admin:', authError);
      } else {
        console.log('✅ Successfully signed in as admin');
        console.log('   Access token retrieved');
      }
    } else {
      console.log('ℹ️ No admin users found');
    }
    
    console.log('\nAuthenticated connection test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
  }
}

testAuthenticatedConnection()
  .catch(console.error)
  .finally(() => process.exit(0));
