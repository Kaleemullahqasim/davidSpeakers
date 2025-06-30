import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          // This is used for setting cookies in the response
          request.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // This is used for removing cookies in the response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Create a new response
  const response = NextResponse.next()

  // Check the auth session and refresh the token if needed
  await supabase.auth.getSession()

  // Update response cookies from the middleware cookies
  request.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 