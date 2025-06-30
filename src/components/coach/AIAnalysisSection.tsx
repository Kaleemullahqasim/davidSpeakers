import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Zap, PlayCircle, Bot, ArrowRight } from 'lucide-react';

interface AIAnalysisSectionProps {
  evaluationId: string;
  aiAnalysis: any;
  isLoading: boolean;
  onAnalysisComplete: (analysis: any) => void;
  hasTranscript: boolean;
  audienceInfo: string;
}

export function AIAnalysisSection({
  evaluationId,
  aiAnalysis,
  isLoading,
  onAnalysisComplete,
  hasTranscript,
  audienceInfo
}: AIAnalysisSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(isLoading);
  const [error, setError] = useState('');

  // Function to trigger the AI analysis
  const handleRunAnalysis = async () => {
    if (!hasTranscript) {
      setError('A transcript is required to run AI analysis. Please generate a transcript first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    try {
      console.log('Triggering AI analysis for evaluation:', evaluationId);
      
      // This is the actual API call that should use Google Gemini API
      const response = await fetchWithAuth(`/api/evaluations/analyze`, {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          audience: audienceInfo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze transcript');
      }

      const data = await response.json();
      console.log('AI analysis complete:', data);
      
      // Notify parent component that analysis is complete
      onAnalysisComplete(data.analysis);
    } catch (err) {
      console.error('Error analyzing transcript:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-4 border-indigo-500 shadow-xl overflow-hidden">
        <CardHeader className="bg-indigo-600 text-white">
          <CardTitle className="flex items-center justify-center text-xl">
            <Bot className="h-6 w-6 mr-3 animate-pulse" />
            Google Gemini AI Analysis in Progress
          </CardTitle>
          <CardDescription className="text-indigo-100 text-center">
            Sending transcript to Google Gemini API and processing results...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-10">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full border-8 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold">Please Wait...</h3>
              <p className="text-gray-600">Analyzing transcript with Google's Gemini AI model</p>
              <div className="flex justify-center items-center space-x-2 mt-4">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
            <div className="w-full max-w-md bg-gray-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full animate-progress"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-red-500 shadow-xl overflow-hidden">
      <div className="bg-red-600 text-white py-2 px-4 text-center text-lg font-bold uppercase tracking-wider">
        Action Required: AI Analysis
      </div>
      
      <CardHeader className="relative">
        <div className="absolute right-6 top-6">
          <Badge className="bg-blue-600 text-white font-medium px-3 py-1">
            Powered by Google Gemini AI
          </Badge>
        </div>
        <CardTitle className="flex items-center text-xl">
          <Bot className="h-6 w-6 text-red-600 mr-2" />
          Start Language Analysis with Google Gemini
        </CardTitle>
        <CardDescription className="text-gray-700">
          Click the large button below to send transcript to Google Gemini
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!hasTranscript ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <h3 className="font-medium text-amber-800 mb-2">Transcript Required</h3>
            <p className="text-amber-700">
              Please generate a transcript first before running AI analysis.
            </p>
          </div>
        ) : (
          <div className="p-6 border-2 border-red-200 rounded-lg bg-white mb-4">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-red-800 mb-2">Ready for Google Gemini AI Analysis</h3>
                <p className="text-gray-700 mb-3">
                  This will send the transcript to Google Gemini to analyze:
                </p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1">
                  <li><strong>Rhetorical devices</strong> (tricolon, anaphora, etc.)</li>
                  <li><strong>Language patterns</strong> (filler words, negations)</li>
                  <li><strong>Speech structure</strong> (flow, adapted language)</li>
                </ul>
              </div>
            </div>
            
            {/* Main Button - Super Prominent */}
            <Button 
              onClick={handleRunAnalysis} 
              disabled={!hasTranscript}
              className="w-full py-8 text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all hover:shadow-xl hover:scale-105 border-2 border-red-700 animate-pulse hover:animate-none"
            >
              <div className="flex items-center justify-center space-x-3">
                <PlayCircle className="h-8 w-8" />
                <span>CLICK HERE TO START GOOGLE GEMINI ANALYSIS</span>
                <ArrowRight className="h-6 w-6" />
              </div>
            </Button>
            
            {/* Process Flow Diagram */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="bg-gray-100 p-2 rounded">Transcript</div>
              <ArrowRight className="h-4 w-4" />
              <div className="bg-blue-100 p-2 rounded text-blue-800">Google Gemini API</div>
              <ArrowRight className="h-4 w-4" />
              <div className="bg-green-100 p-2 rounded text-green-800">Analysis Results</div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t border-gray-200 text-center py-4">
        <p className="text-sm text-gray-500">
          This analysis uses Google's advanced Gemini AI model to evaluate language skills
        </p>
      </CardFooter>
    </Card>
  );
}
