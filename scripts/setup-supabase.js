/**
 * Supabase Database Setup Script
 * 
 * Run this script with: node scripts/setup-supabase.js
 * 
 * This script will create the necessary tables and policies for the David Speaker App
 * based on the PRD requirements.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for full database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service role key in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Using direct SQL execution through Supabase's REST API is not possible,
    // so we'll create tables by inserting data and letting Supabase auto-create them
    
    // First, check for existing tables
    const { error: tableCheckError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Tables do not exist yet, creating schema...');
      
      // We need to use Supabase dashboard to create tables
      console.log(`
Please create the following tables in your Supabase dashboard:

1. Create 'users' table with the following columns:
   - id: uuid (primary key, references auth.users)
   - email: text (not null)
   - name: text (not null)
   - role: text (not null, check: 'student', 'coach', 'admin')
   - approved: boolean (default: false)
   - created_at: timestamp with time zone (default: now())

2. Create 'evaluations' table with the following columns:
   - id: uuid (primary key)
   - user_id: uuid (references users.id, not null)
   - video_id: text (not null)
   - title: text
   - status: text (not null, check: 'pending', 'completed', 'review_requested', 'reviewed', 'error')
   - results: jsonb
   - coach_feedback: text
   - coach_id: uuid (references users.id)
   - error_message: text
   - created_at: timestamp with time zone (default: now())
   - completed_at: timestamp with time zone

3. Create 'skills' table with the following columns:
   - id: uuid (primary key, default: uuid_generate_v4())
   - name: text (not null)
   - category: text (not null)
   - description: text
   - weight: integer (not null, default: 5)

4. Create 'scoring_rules' table with the following columns:
   - id: uuid (primary key, default: uuid_generate_v4())
   - skill_id: uuid (references skills.id, not null)
   - min_occurrences: integer (not null)
   - max_occurrences: integer
   - score: integer (not null)
      `);
      
      console.log("Tables need to be created manually. Please follow the instructions above.");
      console.log("After creating tables, run this script again to populate them with initial data.");
      process.exit(0);
    }

    // If we reach here, it means tables exist, so we'll populate them with initial data
    console.log('Tables already exist, proceeding to insert initial data...');

    // 5. Insert default skills data
    console.log('Inserting default skills data...');
    const defaultSkills = [
      // Structural & Strategic Language
      { name: 'adapted_language', category: 'structural', description: 'Language adapted to audience needs', weight: 7 },
      { name: 'flow', category: 'structural', description: 'Smooth transitions between ideas', weight: 8 },
      { name: 'strong_rhetoric', category: 'structural', description: 'Persuasive language and phrasing', weight: 8 },
      { name: 'strategic_language', category: 'structural', description: 'Purposeful choice of words', weight: 7 },
      { name: 'valued_language', category: 'structural', description: 'Language that conveys value', weight: 6 },
      
      // Filler & Weak Language
      { name: 'filler_language', category: 'filler', description: 'Unnecessary words like "um", "uh", "like"', weight: 7 },
      { name: 'negations', category: 'filler', description: 'Negative phrases and words', weight: 5 },
      { name: 'repetitive_words', category: 'filler', description: 'Excessive use of the same words', weight: 6 },
      { name: 'absolute_words', category: 'filler', description: 'Words like "always", "never", "all"', weight: 4 },
      
      // Rhetorical & Stylistic Devices
      { name: 'hexacolon', category: 'rhetorical', description: 'Six parallel elements in a row', weight: 6 },
      { name: 'tricolon', category: 'rhetorical', description: 'Three parallel elements in a row', weight: 7 },
      { name: 'repetition', category: 'rhetorical', description: 'Repeated words for emphasis', weight: 6 },
      { name: 'anaphora', category: 'rhetorical', description: 'Repetition at the beginning of sentences', weight: 7 },
      { name: 'epiphora', category: 'rhetorical', description: 'Repetition at the end of sentences', weight: 6 },
      { name: 'alliteration', category: 'rhetorical', description: 'Repetition of the same sound', weight: 5 },
      { name: 'correctio', category: 'rhetorical', description: 'Correcting oneself for emphasis', weight: 5 },
      { name: 'climax', category: 'rhetorical', description: 'Arrangement in order of increasing importance', weight: 7 },
      { name: 'anadiplosis', category: 'rhetorical', description: 'Repetition of the last word', weight: 6 }
    ];

    for (const skill of defaultSkills) {
      const { error } = await supabase
        .from('skills')
        .upsert(skill, { onConflict: 'name' });
      
      if (error) {
        console.error(`Error inserting skill ${skill.name}:`, error);
      } else {
        console.log(`Inserted skill: ${skill.name}`);
      }
    }
    console.log('Default skills inserted successfully');

    // 6. Create example scoring rules for filler words
    console.log('Inserting example scoring rules for filler_language...');
    
    // First get the skill ID for filler_language
    const { data: fillerSkill, error: fillerError } = await supabase
      .from('skills')
      .select('id')
      .eq('name', 'filler_language')
      .single();
    
    if (fillerError) {
      console.error('Error fetching filler_language skill:', fillerError);
    } else {
      const fillerRules = [
        { skill_id: fillerSkill.id, min_occurrences: 0, max_occurrences: 2, score: 0 },
        { skill_id: fillerSkill.id, min_occurrences: 3, max_occurrences: 5, score: -1 },
        { skill_id: fillerSkill.id, min_occurrences: 6, max_occurrences: 8, score: -2 },
        { skill_id: fillerSkill.id, min_occurrences: 9, max_occurrences: 11, score: -3 },
        { skill_id: fillerSkill.id, min_occurrences: 12, max_occurrences: 14, score: -4 },
        { skill_id: fillerSkill.id, min_occurrences: 15, max_occurrences: null, score: -5 }
      ];

      for (const rule of fillerRules) {
        const { error } = await supabase
          .from('scoring_rules')
          .insert(rule);
        
        if (error) {
          console.error(`Error inserting rule for filler_language:`, error);
        } else {
          console.log(`Inserted rule: ${rule.min_occurrences}-${rule.max_occurrences || 'inf'} -> ${rule.score}`);
        }
      }
      console.log('Example scoring rules inserted successfully');
    }

    // 7. Create an admin user for initial access
    console.log('Creating admin user (if not exists)...');
    
    // Check if the admin user already exists
    const { data: existingAdminUsers, error: adminCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin')
      .limit(1);
      
    if (adminCheckError) {
      console.error('Error checking for existing admin:', adminCheckError);
    } else if (existingAdminUsers && existingAdminUsers.length > 0) {
      console.log(`Admin user already exists: ${existingAdminUsers[0].email}`);
    } else {
      try {
        // Create admin user in auth
        const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
          email: 'admin@davidspeaker.com',
          password: 'admin123', // Change this to a secure password
          email_confirm: true,
          user_metadata: {
            name: 'Admin User'
          }
        });
        
        if (adminError) {
          console.error('Error creating admin user:', adminError);
          
          // If the user already exists in auth, let's try to get the ID
          const { data: userByEmail } = await supabase.auth.admin.listUsers({
            filters: {
              email: 'admin@davidspeaker.com'
            }
          });
          
          if (userByEmail && userByEmail.users && userByEmail.users.length > 0) {
            // Insert admin user record if it doesn't exist in the users table
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: userByEmail.users[0].id,
                  email: 'admin@davidspeaker.com',
                  name: 'Admin User',
                  role: 'admin',
                  approved: true
                }
              ]);
            
            if (insertError) {
              console.error('Error inserting admin user record:', insertError);
            } else {
              console.log('Admin user record created with email: admin@davidspeaker.com');
            }
          }
        } else if (adminUser) {
          // Insert admin user record
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: adminUser.user.id,
                email: 'admin@davidspeaker.com',
                name: 'Admin User',
                role: 'admin',
                approved: true
              }
            ]);
          
          if (insertError) {
            console.error('Error inserting admin user record:', insertError);
          } else {
            console.log('Admin user created successfully with email: admin@davidspeaker.com');
          }
        }
      } catch (error) {
        console.error('Error in admin user creation process:', error);
      }
    }

    console.log('Database setup completed!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase()
  .catch(console.error)
  .finally(() => process.exit(0));
