import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export default function ConfirmPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const handleConfirmation = async () => {
      const { token_hash, type, next = '/' } = router.query
      
      if (!token_hash || !type) {
        setError('Missing confirmation parameters')
        setIsLoading(false)
        return
      }
      
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token_hash as string,
          type: type as EmailOtpType
        })
        
        if (error) {
          throw error
        }
        
        // Redirect the user
        router.push(next as string)
      } catch (err: any) {
        console.error('Error during confirmation:', err)
        setError(err.message || 'Failed to confirm your account')
        setIsLoading(false)
      }
    }
    
    if (router.isReady) {
      handleConfirmation()
    }
  }, [router.isReady, router.query])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p>Verifying your account...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Failed</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }
  
  return null // This shouldn't render as we'll redirect on success
} 