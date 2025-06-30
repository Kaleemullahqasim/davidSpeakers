/**
 * @deprecated Use the new client utilities in utils/supabase/* instead
 * This file is kept for backwards compatibility with existing code
 */

import { createClient as createBrowserClient } from '@/utils/supabase/client'

// Create a singleton instance for compatibility with old code
export const supabase = createBrowserClient()

// Export the function as well for components that need to create their own client
export const createClient = createBrowserClient 