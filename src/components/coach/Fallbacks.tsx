import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Fallback component to use when a component fails to load
 */
export function ComponentErrorFallback({ componentName }: { componentName: string }) {
  return (
    <Card className="border-2 border-red-500">
      <CardHeader className="bg-red-50">
        <CardTitle className="text-red-700">Component Loading Error</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{componentName} Failed to Load</AlertTitle>
          <AlertDescription>
            <p className="mb-4">The {componentName} component could not be loaded correctly.</p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Simple language tab content fallback
 */
export function LanguageTabContentFallback() {
  return (
    <div className="p-6 border-2 border-red-200 rounded-lg">
      <h3 className="text-xl font-bold text-red-800 mb-4">Language Analysis Component Error</h3>
      <p className="mb-4">
        The AI analysis component failed to load properly. This might be a temporary issue.
      </p>
      <Button
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        Refresh Page
      </Button>
    </div>
  );
}
