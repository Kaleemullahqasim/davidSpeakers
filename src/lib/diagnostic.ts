import { supabase } from './supabase';

/**
 * Utility to run network diagnostic tests for Supabase connection
 */
export async function runSupabaseDiagnostic() {
  console.log("⏳ Running Supabase connection diagnostic...");
  
  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log("✓ Environment variables check:", {
    url: supabaseUrl ? "Present" : "MISSING",
    key: supabaseKey ? "Present" : "MISSING",
  });

  // Check local storage for existing session
  const hasLocalStorageSession = !!localStorage.getItem('sb-' + supabaseUrl?.replace(/^https?:\/\//, '').split('.')[0] + '-auth-token');
  console.log("✓ Local storage session:", hasLocalStorageSession ? "Present" : "Not found");

  // Try to ping Supabase
  try {
    console.log("⏳ Testing Supabase connection...");
    const startTime = performance.now();
    const { data, error } = await supabase.from('coach_profiles').select('count(*)').limit(1).maybeSingle();
    const endTime = performance.now();
    
    if (error) {
      console.error("❌ Supabase connection test failed:", error);
      return {
        success: false,
        message: `Supabase connection failed: ${error.message}`,
        error
      };
    }
    
    console.log(`✓ Supabase connection successful (${Math.round(endTime - startTime)}ms)`);
    return {
      success: true,
      message: `Supabase connection successful in ${Math.round(endTime - startTime)}ms`,
      data
    };
  } catch (err) {
    console.error("❌ Exception during Supabase test:", err);
    return {
      success: false,
      message: `Exception during Supabase test: ${err instanceof Error ? err.message : String(err)}`,
      error: err
    };
  }
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).testSupabase = runSupabaseDiagnostic;
} 