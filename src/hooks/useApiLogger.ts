import { useState, useCallback, useEffect } from 'react';

/**
 * A hook to log API calls to the console for better debugging
 */
export function useApiLogger() {
  const [apiCalls, setApiCalls] = useState<Array<{
    endpoint: string,
    method: string,
    timestamp: Date,
    status?: number,
    success?: boolean,
    duration?: number
  }>>([]);

  const logApiCall = useCallback((endpoint: string, method: string = 'GET') => {
    const start = new Date();
    console.log(`📡 API REQUEST: ${method} ${endpoint} at ${start.toLocaleTimeString()}`);

    // Add to the log
    const newCall = { endpoint, method, timestamp: start };
    setApiCalls(prev => [...prev, newCall]);
    
    // Return functions to update with response info
    return {
      success: (status: number, data: any) => {
        const end = new Date();
        const duration = end.getTime() - start.getTime();
        console.log(`✅ API SUCCESS: ${method} ${endpoint} (${status}) - ${duration}ms`);
        console.log('Response data:', data);
      },
      error: (error: any) => {
        const end = new Date();
        const duration = end.getTime() - start.getTime();
        console.error(`❌ API ERROR: ${method} ${endpoint} - ${duration}ms`);
        console.error(error);
      }
    };
  }, []);

  useEffect(() => {
    // Add event listeners to catch all fetch calls if needed
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      
      const logger = logApiCall(url, method);
      
      try {
        const response = await originalFetch(input, init);
        if (response.ok) {
          logger.success(response.status, 'Response OK');
        } else {
          logger.error({ status: response.status, statusText: response.statusText });
        }
        return response;
      } catch (error) {
        logger.error(error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logApiCall]);

  return { logApiCall, apiCalls };
}
