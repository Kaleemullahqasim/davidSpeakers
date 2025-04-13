import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { getAuthToken } from './auth-helpers';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'coach' | 'admin';
  approved: boolean;
  created_at: string;
}

export interface Evaluation {
  id: string;
  user_id: string;
  video_id: string;
  title?: string;
  status: string;
  results?: any;
  coach_feedback?: string;
  coach_id?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  users?: User;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  weight: number;
}

export interface ScoringRule {
  id: string;
  skill_id: string;
  min_occurrences: number;
  max_occurrences: number | null;
  score: number;
}

// Initialize Supabase client
let supabase: SupabaseClient | null = null;

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  supabase = createClient(supabaseUrl, supabaseKey);
}

// API functions
export async function fetchUserEvaluations(userId: string): Promise<Evaluation[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Error in fetchUserEvaluations:', error);
    throw error;
  }
}

export async function fetchCoachUsers(): Promise<User[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    console.log('Fetching coach users...');
    
    // Remove the approved filter to see if we're getting any coaches at all
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'coach')
      // Commented out to check if the issue is with the approval filter
      // .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coach users:', error);
      throw new Error(error.message);
    }
    
    console.log(`Found ${data?.length || 0} coach users:`, data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchCoachUsers:', error);
    throw error;
  }
}

export async function fetchStudentUsers(): Promise<User[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    console.log('Fetching student users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching student users:', error);
      throw new Error(error.message);
    }
    
    console.log(`Found ${data?.length || 0} student users:`, data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchStudentUsers:', error);
    return []; // Return empty array instead of throwing to prevent dashboard breakage
  }
}

export async function fetchCoachEvaluations(coachId: string): Promise<Evaluation[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  console.log(`Fetching evaluations for coach ${coachId}`);
  
  try {
    // Get evaluations that are assigned to this coach OR have review_requested status
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .or(`coach_id.eq.${coachId},status.eq.review_requested`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coach evaluations:', error);
      throw new Error('Failed to fetch evaluations');
    }

    console.log(`Found ${data?.length || 0} evaluations for coach ${coachId}`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchCoachEvaluations:', error);
    throw error;
  }
}

// This is a helper function to fetch data from the API with authentication

export async function fetchEvaluation(id: string) {
  try {
    console.log(`Fetching evaluation with ID: ${id}`);
    
    // Get the auth token from local storage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found in local storage");
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`/api/evaluations/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear token if it's invalid to force re-login
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        throw new Error('Your session has expired. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('You do not have permission to access this evaluation');
      }
      
      if (response.status === 404) {
        throw new Error('Evaluation not found');
      }
      
      // Try to get more details from the error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching evaluation ${id}:`, error);
    throw error;
  }
}

export async function updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    console.log(`Updating evaluation ${id} with:`, updates);
    
    const { data, error } = await supabase
      .from('evaluations')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating evaluation:', error);
      throw new Error(`Failed to update evaluation: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from update operation');
    }
    
    console.log('Evaluation updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateEvaluation:', error);
    throw error;
  }
}

export async function fetchAllEvaluations(): Promise<Evaluation[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Error in fetchAllEvaluations:', error);
    throw error;
  }
}

export async function fetchSkills(): Promise<Skill[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Error in fetchSkills:', error);
    throw error;
  }
}

export async function fetchScoringRules(skillId: string): Promise<ScoringRule[]> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('scoring_rules')
      .select('*')
      .eq('skill_id', skillId)
      .order('min_occurrences', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Error in fetchScoringRules:', error);
    throw error;
  }
}

export async function updateSkillWeight(skillId: string, weight: number): Promise<Skill> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('skills')
      .update({ weight })
      .eq('id', skillId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Skill not found');
    
    return data;
  } catch (error) {
    console.error('Error in updateSkillWeight:', error);
    throw error;
  }
}

export async function updateScoringRule(ruleId: string, updates: Partial<ScoringRule>): Promise<ScoringRule> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('scoring_rules')
      .update(updates)
      .eq('id', ruleId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Scoring rule not found');
    
    return data;
  } catch (error) {
    console.error('Error in updateScoringRule:', error);
    throw error;
  }
}

export async function updateUserApproval(userId: string, approved: boolean): Promise<User> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ approved })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');
    
    return data;
  } catch (error) {
    console.error('Error in updateUserApproval:', error);
    throw error;
  }
}

export async function promoteCoachToAdmin(coachId: string): Promise<User> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', coachId)
      .eq('role', 'coach')  // Make sure user is currently a coach
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Coach not found');
    
    return data;
  } catch (error) {
    console.error('Error in promoteCoachToAdmin:', error);
    throw error;
  }
}

// Add a new function to transcribe videos
export async function transcribeEvaluationVideo(evaluationId: string, videoId: string): Promise<any> {
  if (!supabase) throw new Error('Supabase client not available');
  
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/evaluations/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ evaluationId, videoId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to transcribe video');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw error;
  }
}