import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Student {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Evaluation {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  final_score: number | null;
  user_id: string;
  coach_id: string | null;
  video_id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header to verify identity
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { searchQuery, coachId } = req.query;

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!coachId || typeof coachId !== 'string') {
      return res.status(400).json({ error: 'Coach ID is required' });
    }
    
    // Verify that the authenticated user is the coach making the request
    if (userData.user.id !== coachId) {
      return res.status(403).json({ error: 'Unauthorized: You can only search for your own students' });
    }

    // Search for students by name or email (case insensitive)
    const searchTerm = `%${searchQuery.toLowerCase()}%`;
    
    // First, get students that match the search criteria
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        created_at
      `)
      .eq('role', 'student')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .order('name');

    if (studentsError) {
      console.error('Error searching students:', studentsError);
      return res.status(500).json({ error: 'Failed to search students' });
    }

    if (!students || students.length === 0) {
      return res.status(200).json({ 
        students: [],
        message: 'No students found matching your search criteria'
      });
    }

    // Get student IDs for evaluation lookup
    const studentIds = students.map(student => student.id);

    // Get all evaluations for these students, including those assigned to this coach
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('evaluations')
      .select(`
        id,
        title,
        status,
        created_at,
        completed_at,
        final_score,
        user_id,
        coach_id,
        video_id
      `)
      .in('user_id', studentIds)
      .order('created_at', { ascending: false });

    if (evaluationsError) {
      console.error('Error fetching evaluations:', evaluationsError);
      return res.status(500).json({ error: 'Failed to fetch evaluations' });
    }

    // Group evaluations by student and add student info
    const studentsWithEvaluations = students.map((student: Student) => {
      const studentEvaluations = evaluations?.filter((evaluation: Evaluation) => evaluation.user_id === student.id) || [];
      
      // Separate evaluations by those assigned to this coach vs others
      const myEvaluations = studentEvaluations.filter((evaluation: Evaluation) => evaluation.coach_id === coachId);
      const otherEvaluations = studentEvaluations.filter((evaluation: Evaluation) => evaluation.coach_id !== coachId);
      
      return {
        ...student,
        evaluations: {
          total: studentEvaluations.length,
          myEvaluations: myEvaluations.length,
          otherEvaluations: otherEvaluations.length,
          pending: myEvaluations.filter((evaluation: Evaluation) => evaluation.status === 'review_requested').length,
          inProgress: myEvaluations.filter((evaluation: Evaluation) => evaluation.status === 'coach_reviewing').length,
          completed: myEvaluations.filter((evaluation: Evaluation) => ['published', 'reviewed'].includes(evaluation.status)).length,
          allEvaluations: studentEvaluations,
          myEvaluationsList: myEvaluations
        }
      };
    });

    // Sort by students with more evaluations assigned to this coach first
    studentsWithEvaluations.sort((a, b) => {
      // First by number of evaluations assigned to this coach
      if (b.evaluations.myEvaluations !== a.evaluations.myEvaluations) {
        return b.evaluations.myEvaluations - a.evaluations.myEvaluations;
      }
      // Then by total evaluations
      if (b.evaluations.total !== a.evaluations.total) {
        return b.evaluations.total - a.evaluations.total;
      }
      // Finally by name
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({
      students: studentsWithEvaluations,
      count: studentsWithEvaluations.length,
      searchQuery
    });

  } catch (error) {
    console.error('Error in search-students API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 