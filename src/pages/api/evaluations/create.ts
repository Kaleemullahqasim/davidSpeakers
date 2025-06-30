import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
    const { videoId, audience } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ message: 'Missing videoId' });
    }

    // Get the authorization header to verify identity
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    
    // Generate a unique ID for the evaluation
    const evaluationId = uuidv4();
    
    // Create a new evaluation record
    const { data, error } = await supabase
      .from('evaluations')
      .insert([
        {
          id: evaluationId,
          user_id: userData.user.id,
          video_id: videoId,
          status: 'pending', // Initial status is pending
          results: audience ? { audience } : {} // Store audience information
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating evaluation:', error);
      return res.status(500).json({ 
        message: 'Failed to create evaluation',
        details: error.message
      });
    }
    
    console.log(`Successfully created evaluation ${evaluationId} for video ${videoId}`);
    
    // Start processing the video asynchronously
    // Note: In production, you would use a queue system or a webhook
    fetch(`${process.env.NEXTAUTH_URL || ''}/api/evaluations/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
      },
      body: JSON.stringify({ evaluationId })
    }).catch(err => {
      console.error('Error queueing evaluation for processing:', err);
    });
    
    return res.status(201).json({
      message: 'Evaluation created successfully',
      evaluationId: data.id
    });
  } catch (error) {
    console.error('Error in create evaluation API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Keep this function but it won't be called automatically anymore
// It will be triggered by admin assigning a coach
async function simulateProcessing(evaluationId: string) {
  console.log(`Starting mock processing for evaluation: ${evaluationId}`);
  
  // Wait 5 seconds to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Update the evaluation status to 'completed'
  try {
    const { error } = await supabase
      .from('evaluations')
      .update({
        status: 'completed', // Using allowed status value from constraint
        completed_at: new Date().toISOString()
      })
      .eq('id', evaluationId);
    
    if (error) {
      console.error('Error updating evaluation:', error);
    } else {
      console.log(`Updated evaluation ${evaluationId} status to 'completed'`);
    }
  } catch (error) {
    console.error('Error in processing simulation:', error);
  }
}
