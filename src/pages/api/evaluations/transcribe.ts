import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { transcribeYouTubeVideo } from '@/lib/youtubeTranscription'; // Ensure correct path

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string; // Use the service role key for admin actions

// Ensure client is initialized only once or use a shared instance
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[transcribe API] Received request');
  if (req.method !== 'POST') {
    console.log(`[transcribe API] Method Not Allowed: ${req.method}`);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, videoId } = req.body;
    console.log(`[transcribe API] Processing evaluationId: ${evaluationId}, videoId: ${videoId}`);

    if (!evaluationId || !videoId) {
      console.error('[transcribe API] Missing evaluationId or videoId in request body');
      return res.status(400).json({ message: 'Missing evaluationId or videoId' });
    }

    // Verify environment variables needed for Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("[transcribe API] Supabase URL or Service Role Key is not configured in environment variables.");
        return res.status(500).json({ message: "Server configuration error." });
    }
    console.log('[transcribe API] Supabase env vars seem present.');


    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[transcribe API] Missing or invalid Authorization header');
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    console.log('[transcribe API] Auth token extracted.');

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      console.error('[transcribe API] Supabase auth.getUser error:', authError.message);
      return res.status(401).json({ message: `Authentication error: ${authError.message}` });
    }
    if (!userData?.user) {
      console.error('[transcribe API] Supabase auth.getUser did not return a user.');
      return res.status(401).json({ message: 'Authentication error: User not found' });
    }
    console.log(`[transcribe API] User authenticated: ${userData.user.id}`);

    const { data: userRoleData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (userRoleError) {
      console.error(`[transcribe API] Error fetching user role for ${userData.user.id}:`, userRoleError.message);
      return res.status(500).json({ message: `Error fetching user role: ${userRoleError.message}` });
    }
    if (!userRoleData || userRoleData.role !== 'coach') {
      console.warn(`[transcribe API] User ${userData.user.id} is not a coach. Role: ${userRoleData?.role}`);
      return res.status(403).json({ message: 'Forbidden: Coach access required' });
    }
    console.log(`[transcribe API] User ${userData.user.id} confirmed as coach.`);

    console.log(`[transcribe API] Starting transcription for video ${videoId} (evaluation ${evaluationId})`);
    const transcript = await transcribeYouTubeVideo(videoId);
    console.log(`[transcribe API] Transcription completed for video ${videoId}. Transcript length: ${transcript?.length}`);

    if (!transcript) {
        console.error(`[transcribe API] Transcription failed or returned empty for videoId: ${videoId}`);
        return res.status(500).json({ message: 'Failed to transcribe video or transcript was empty' });
    }

    const { error: updateError } = await supabase
      .from('evaluations')
      .update({ transcript: transcript, status: 'transcribed' }) // Assuming 'transcribed' is a valid status
      .eq('id', evaluationId);

    if (updateError) {
      console.error(`[transcribe API] Error updating evaluation ${evaluationId} with transcript:`, updateError.message);
      return res.status(500).json({ message: `Failed to update evaluation: ${updateError.message}` });
    }
    console.log(`[transcribe API] Successfully updated evaluation ${evaluationId} with transcript.`);

    return res.status(200).json({ message: 'Transcription successful', transcript });

  } catch (error: any) {
    console.error('[transcribe API] Unhandled error in handler:', error);
    if (error.message) {
      console.error(`[transcribe API] Error message: ${error.message}`);
    }
    if (error.stack) {
        console.error(`[transcribe API] Error stack: ${error.stack}`);
    }
    return res.status(500).json({ message: `Internal server error: ${error.message || 'Unknown error'}` });
  }
}
