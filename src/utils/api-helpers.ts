import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for API routes in the Pages Router
 */
export function createServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          cookie: req.headers.cookie || '',
        },
      },
    }
  )
}

/**
 * Helper to authenticate API routes
 */
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (user: any, supabase: any) => Promise<void>
) {
  const supabase = createServerClient(req, res)
  
  // Verify the user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Call the handler with the authenticated user
  return handler(user, supabase)
} 