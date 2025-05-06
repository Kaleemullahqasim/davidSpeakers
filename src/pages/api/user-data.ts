import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/utils/api-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return withAuth(req, res, async (user, supabase) => {
    // Example: Get user profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.status(200).json({ user: data })
  })
} 