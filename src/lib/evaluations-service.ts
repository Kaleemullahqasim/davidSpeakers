import { supabase } from './supabase';
import type { Database } from '../types/supabase';

type Evaluation = Database['public']['Tables']['evaluations']['Row'];
type InsertEvaluation = Database['public']['Tables']['evaluations']['Insert'];
type UpdateEvaluation = Database['public']['Tables']['evaluations']['Update'];

type VideoComment = Database['public']['Tables']['video_comments']['Row'];
type InsertVideoComment = Database['public']['Tables']['video_comments']['Insert'];

/**
 * Create a new evaluation
 */
export async function createEvaluation(
  assignmentId: string,
  videoId: string,
  studentId: string,
  evaluation: Omit<InsertEvaluation, 'assignment_id' | 'coach_id' | 'video_id' | 'student_id'>
): Promise<Evaluation> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const coachId = userData.user.id;
  
  const { data, error } = await supabase
    .from('evaluations')
    .insert({
      ...evaluation,
      assignment_id: assignmentId,
      coach_id: coachId,
      video_id: videoId,
      student_id: studentId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get an evaluation by ID
 */
export async function getEvaluation(id: string): Promise<Evaluation | null> {
  const { data, error } = await supabase
    .from('evaluations')
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
 * Update an evaluation
 */
export async function updateEvaluation(
  id: string, 
  updates: UpdateEvaluation
): Promise<Evaluation> {
  const { data, error } = await supabase
    .from('evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get an evaluation by assignment ID
 */
export async function getEvaluationByAssignment(
  assignmentId: string
): Promise<Evaluation | null> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('assignment_id', assignmentId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data;
}

/**
 * Get evaluations for the current student
 */
export async function getMyEvaluations(): Promise<Evaluation[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const studentId = userData.user.id;
  
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get evaluations created by the current coach
 */
export async function getMyCreatedEvaluations(): Promise<Evaluation[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const coachId = userData.user.id;
  
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Add a timestamped comment to a video evaluation
 */
export async function addVideoComment(
  evaluationId: string,
  timestampSeconds: number,
  comment: string
): Promise<VideoComment> {
  const { data, error } = await supabase
    .from('video_comments')
    .insert({
      evaluation_id: evaluationId,
      timestamp_seconds: timestampSeconds,
      comment
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get all comments for an evaluation
 */
export async function getVideoComments(evaluationId: string): Promise<VideoComment[]> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('timestamp_seconds', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

/**
 * Delete a video comment
 */
export async function deleteVideoComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('video_comments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
} 