import { supabase } from './supabase';
import type { Database } from '../types/supabase';

type VideoSubmission = Database['public']['Tables']['video_submissions']['Row'];
type InsertVideoSubmission = Database['public']['Tables']['video_submissions']['Insert'];
type UpdateVideoSubmission = Database['public']['Tables']['video_submissions']['Update'];

/**
 * Create a new video submission
 */
export async function createVideoSubmission(submission: Omit<InsertVideoSubmission, 'student_id'>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const userId = userData.user.id;
  
  const { data, error } = await supabase
    .from('video_submissions')
    .insert({
      ...submission,
      student_id: userId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get a video submission by ID
 */
export async function getVideoSubmission(id: string): Promise<VideoSubmission | null> {
  const { data, error } = await supabase
    .from('video_submissions')
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
 * Update a video submission
 */
export async function updateVideoSubmission(id: string, updates: UpdateVideoSubmission) {
  const { data, error } = await supabase
    .from('video_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a video submission
 */
export async function deleteVideoSubmission(id: string) {
  const { error } = await supabase
    .from('video_submissions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Get all video submissions for the current user (student)
 */
export async function getMyVideoSubmissions(): Promise<VideoSubmission[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const userId = userData.user.id;
  
  const { data, error } = await supabase
    .from('video_submissions')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get all video submissions assigned to the current user (coach)
 */
export async function getAssignedVideoSubmissions(): Promise<VideoSubmission[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const userId = userData.user.id;
  
  const { data, error } = await supabase
    .from('coach_assignments')
    .select(`
      video_id,
      status,
      video_submissions (*)
    `)
    .eq('coach_id', userId);
  
  if (error) throw error;
  
  // Extract video submissions from the joined data
  return (data || [])
    .map(assignment => {
      // Type assertion for nested object
      return assignment.video_submissions as unknown as VideoSubmission;
    })
    .filter(Boolean);
}

/**
 * Get all video submissions (for admin)
 */
export async function getAllVideoSubmissions(): Promise<VideoSubmission[]> {
  const { data, error } = await supabase
    .from('video_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
} 