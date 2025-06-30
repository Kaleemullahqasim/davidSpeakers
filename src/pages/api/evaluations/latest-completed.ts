import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return withAuth(req, res, async (user, supabase) => {
    try {
      // Only allow students to access this endpoint
      if (user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied. Students only.' })
      }

      console.log(`Fetching latest completed evaluation for student: ${user.id}`)

      // Fetch the most recent completed evaluation for this student
      // Sort by completed_at (when coach published results) first, then by updated_at as fallback
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'reviewed', 'published']) // Only completed evaluations
        .not('completed_at', 'is', null) // Must have a completion date
        .order('completed_at', { ascending: false }) // Sort by completion date (most recent first)
        .order('updated_at', { ascending: false }) // Secondary sort by update date
        .limit(1) // Only get the most recent one

      if (error) {
        console.error('Error fetching latest completed evaluation:', error)
        return res.status(500).json({ error: error.message })
      }

      // If no completed evaluations found
      if (!data || data.length === 0) {
        console.log(`No completed evaluations found for student ${user.id}`)
        return res.status(404).json({ 
          error: 'No completed evaluations found',
          hasCompletedEvaluations: false 
        })
      }

      const latestEvaluation = data[0]
      console.log(`Found latest completed evaluation: ${latestEvaluation.id} (completed: ${latestEvaluation.completed_at})`)

      return res.status(200).json({ 
        evaluation: latestEvaluation,
        hasCompletedEvaluations: true 
      })

    } catch (error) {
      console.error('Error in latest-completed API:', error)
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      })
    }
  })
} 