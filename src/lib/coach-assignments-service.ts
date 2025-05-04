import { supabase } from './supabase';
import type { Database } from '../types/supabase';

type CoachAssignment = Database['public']['Tables']['coach_assignments']['Row'];
type InsertCoachAssignment = Database['public']['Tables']['coach_assignments']['Insert'];
type UpdateCoachAssignment = Database['public']['Tables']['coach_assignments']['Update'];

/**
 * Assign a coach to a video submission (admin only)
 */
export async function assignCoachToVideo(
  videoId: string, 
  coachId: string, 
  note?: string
): Promise<CoachAssignment> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const adminId = userData.user.id;
  
  const { data, error } = await supabase
    .from('coach_assignments')
    .insert({
      video_id: videoId,
      coach_id: coachId,
      assigned_by: adminId,
      assignment_note: note || null,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Also update the video submission status to 'assigned'
  const { error: updateError } = await supabase
    .from('video_submissions')
    .update({ status: 'assigned' })
    .eq('id', videoId);
  
  if (updateError) throw updateError;
  
  return data;
}

/**
 * Get an assignment by ID
 */
export async function getAssignment(id: string): Promise<CoachAssignment | null> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data;
}

/**
 * Update an assignment status
 */
export async function updateAssignmentStatus(
  id: string, 
  status: 'pending' | 'in_progress' | 'completed'
): Promise<CoachAssignment> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // If status is completed, update the video submission status to 'evaluated'
  if (status === 'completed') {
    const { error: updateError } = await supabase
      .from('video_submissions')
      .update({ status: 'evaluated' })
      .eq('id', data.video_id);
    
    if (updateError) throw updateError;
  }
  
  return data;
}

/**
 * Get all assignments for the current coach
 */
export async function getMyAssignments(): Promise<CoachAssignment[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const coachId = userData.user.id;
  
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get all assignments with video and student details
 */
export async function getMyAssignmentsWithDetails() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const coachId = userData.user.id;
  
  const { data, error } = await supabase
    .from('coach_assignments')
    .select(`
      *,
      video_submissions (
        id,
        title,
        video_url,
        description,
        target_audience,
        status,
        created_at,
        student_id
      )
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get all assignments (admin only)
 */
export async function getAllAssignments(): Promise<CoachAssignment[]> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get all coaches approved to review videos
 */
export async function getApprovedCoaches() {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select(`
      user_id,
      specializations,
      auth.users!inner (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('status', 'approved');
  
  if (error) throw error;
  
  // Transform data to more usable format
  return (data || []).map(coach => {
    // Type for joined data
    interface CoachWithUser {
      user_id: string;
      specializations: string[];
      'auth.users': {
        id: string;
        email: string;
        raw_user_meta_data: {
          full_name?: string;
          [key: string]: any;
        };
      };
    }
    
    // Cast to our expected type
    const typedCoach = coach as unknown as CoachWithUser;
    const userData = typedCoach['auth.users'];
    
    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.raw_user_meta_data?.full_name || '',
      specializations: typedCoach.specializations
    };
  });
} 