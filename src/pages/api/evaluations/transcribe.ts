import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { transcribeYouTubeVideo } from '@/lib/youtubeTranscription';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, videoId } = req.body;
    
    if (!evaluationId || !videoId) {
      return res.status(400).json({ message: 'Missing evaluationId or videoId' });
    }

    console.log(`Starting transcription for video ${videoId} (evaluation ${evaluationId})`);
    
    // Get the authorization header to verify identity
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Verify user is a coach
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    
    if (userRoleError || !userRoleData || userRoleData.role !== 'coach') {
      return res.status(403).json({ message: 'Forbidden - Coach access required' });
    }
    
    // Check that the coach is assigned to this evaluation
    const { data: evaluation, error: evalCheckError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .eq('coach_id', userData.user.id)
      .single();
    
    if (evalCheckError || !evaluation) {
      return res.status(403).json({ 
        message: 'Forbidden - You are not assigned to this evaluation',
        details: evalCheckError?.message
      });
    }
    
    // Transcribe the video
    try {
      const transcript = await transcribeYouTubeVideo(videoId);
      
      if (!transcript) {
        throw new Error('Failed to obtain transcript');
      }
      
      // Update the evaluation with the transcript
      const { data: updatedEval, error: updateError } = await supabase
        .from('evaluations')
        .update({
          results: {
            ...evaluation.results,
            transcript
          }
        })
        .eq('id', evaluationId)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update evaluation: ${updateError.message}`);
      }
      
      console.log(`Successfully transcribed video ${videoId}`);
      return res.status(200).json({ 
        transcript,
        message: 'Video transcribed successfully' 
      });
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      return res.status(500).json({ 
        message: 'Failed to transcribe video',
        details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in transcribe API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
