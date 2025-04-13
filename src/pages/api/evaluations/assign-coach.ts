import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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
    const { evaluationId, coachId } = req.body;
    
    if (!evaluationId || !coachId) {
      return res.status(400).json({ message: 'Missing evaluationId or coachId' });
    }

    console.log(`Assigning coach ${coachId} to evaluation ${evaluationId}`);
    
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
    
    // Verify user is admin
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    
    if (userRoleError || !userRoleData || userRoleData.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
    
    // First, check current evaluation status
    const { data: currentEval, error: evalError } = await supabase
      .from('evaluations')
      .select('status')
      .eq('id', evaluationId)
      .single();
      
    if (evalError) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(500).json({ message: 'Failed to fetch evaluation', details: evalError.message });
    }
    
    // Use 'review_requested' status instead of 'coach_assigned' 
    // Based on the allowed statuses from the database schema
    const newStatus = 'review_requested';
    
    console.log(`Updating evaluation ${evaluationId} from status "${currentEval.status}" to "${newStatus}"`);
    
    // Update the evaluation
    const { data, error } = await supabase
      .from('evaluations')
      .update({
        coach_id: coachId,
        status: newStatus // Use an allowed status based on database constraints
      })
      .eq('id', evaluationId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating evaluation:', error);
      return res.status(500).json({ message: 'Failed to update evaluation', details: error.message });
    }
    
    console.log(`Successfully assigned coach ${coachId} to evaluation ${evaluationId}`);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in assign-coach API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
