console.log("LanguageTabContent module loaded successfully!");

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AIScoreTable } from '@/components/coach/AIScoreTable';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Zap, AlertCircle, PlayCircle, Bot, ArrowDown, Bug, RefreshCcw } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { useToast } from '@/components/ui/use-toast';

interface LanguageTabContentProps {
  evaluationId: string;
  hasAnalysis: boolean;
  hasTranscript: boolean;
  evaluation: any;
  isAnalyzing: boolean;
  onAnalysisComplete: (analysis: any) => void;
  audienceInfo: string;
}

export function LanguageTabContent({
  evaluationId,
  hasAnalysis,
  hasTranscript,
  evaluation,
  isAnalyzing: propIsAnalyzing,
  onAnalysisComplete,
  audienceInfo
}: LanguageTabContentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(propIsAnalyzing);
  const [error, setError] = useState('');
  const [showAiTable, setShowAiTable] = useState(hasAnalysis);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const { toast } = useToast();

  // Always log current state and props for debugging
  useEffect(() => {
    console.log("LanguageTabContent - Current state:", {
      evaluationId,
      hasAnalysis,
      hasTranscript,
      hasResults: !!evaluation?.results,
      isAnalyzing,
      showAiTable
    });
    
    if (evaluation?.results?.analysis) {
      console.log("Analysis keys:", Object.keys(evaluation.results.analysis));
    }
  }, [evaluationId, hasAnalysis, hasTranscript, evaluation, isAnalyzing, showAiTable]);

  // Function to save language scores to the database
  const handleSaveLanguageScores = async () => {
    setIsSavingScores(true);
    setError('');
    
    try {
      console.log('SAVING LANGUAGE SCORES for evaluation:', evaluationId);
      
      toast({
        title: 'Saving Language Scores',
        description: 'Converting AI analysis to scores and saving to database...',
      });
      
      const response = await fetchWithAuth(`/api/evaluations/save-language-scores`, {
        method: 'POST',
        body: JSON.stringify({
          evaluationId
        }),
      });
      
      console.log('Save language scores response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error saving language scores:', errorData);
        throw new Error(errorData.message || 'Failed to save language scores');
      }

      const data = await response.json();
      console.log('Language scores saved successfully:', data);
      
      toast({
        title: 'Language Scores Saved!',
        description: `Successfully saved ${data.savedScores} language skill scores. Final score updated to ${data.finalScore.toFixed(2)}/110.`,
        variant: 'default',
      });
      
      // Notify parent component about the score update
      onAnalysisComplete(evaluation?.results?.analysis);
      
    } catch (err) {
      console.error('Error saving language scores:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      toast({
        title: 'Failed to Save Language Scores',
        description: err instanceof Error ? err.message : 'Failed to save language scores to database',
        variant: 'destructive',
      });
    } finally {
      setIsSavingScores(false);
    }
  };

  // Function to trigger the AI analysis using Google Gemini
  const handleRunAnalysis = async () => {
    if (!hasTranscript) {
      toast({
        title: 'Transcript Required',
        description: 'Please generate a transcript first before running AI analysis.',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    try {
      console.log('STARTING GOOGLE GEMINI ANALYSIS for evaluation:', evaluationId);
      
      toast({
        title: 'Google Gemini Analysis Started',
        description: 'Sending transcript to Google Gemini API...',
      });
      
      // Send request to the new analyze API which uses Google Gemini
      const response = await fetchWithAuth(`/api/evaluations/analyze`, {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          audience: audienceInfo
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.message || 'Failed to analyze transcript');
      }

      const data = await response.json();
      console.log('Google Gemini AI analysis complete:', data);
      
      toast({
        title: 'Google Gemini Analysis Complete',
        description: 'Your transcript has been successfully analyzed!',
        variant: 'default',
      });
      
      // Notify parent component
      onAnalysisComplete(data.analysis);
      setShowAiTable(true);
    } catch (err) {
      console.error('Error analyzing transcript with Google Gemini:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      toast({
        title: 'Google Gemini Analysis Failed',
        description: err instanceof Error ? err.message : 'Failed to analyze transcript',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // If we have analysis results and want to show the table
  if (showAiTable && evaluation?.results?.analysis) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveLanguageScores}
              disabled={isSavingScores}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isSavingScores ? 'Saving Language Scores...' : 'Save Language Scores to Database'}
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAiTable(false)}
            className="mb-4"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Run Analysis Again
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Alert className="mb-4 border-green-500 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Important: Save Language Scores</AlertTitle>
          <AlertDescription className="text-green-700">
            After reviewing the AI analysis results, click "Save Language Scores to Database" to include these scores in the final evaluation and make them visible to students.
          </AlertDescription>
        </Alert>
        
        <AIScoreTable 
          evaluationId={evaluationId}
          aiAnalysis={evaluation.results.analysis}
        />
      </div>
    );
  }

  // Otherwise show the button with high visibility
  return (
    <div className="space-y-6">
      <Card className="border-4 border-red-500 overflow-hidden">
        <CardHeader className="bg-red-600 text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-6 w-6 mr-2" />
              Google Gemini AI Analysis Required
            </div>
            <Button 
              variant="outline"
              size="sm" 
              className="bg-white text-red-600 hover:bg-gray-100"
              onClick={() => {
                console.log("DEBUG:", { evaluation });
                toast({
                  title: "Debug Info",
                  description: `Analysis exists: ${!!evaluation?.results?.analysis}`,
                });
              }}
            >
              <Bug className="h-4 w-4 mr-1" />
              Debug
            </Button>
          </CardTitle>
          <CardDescription className="text-white opacity-90">
            You must run Google Gemini AI analysis to score Language skills (85-102)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!hasTranscript ? (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transcript Required</AlertTitle>
              <AlertDescription>
                You need to generate a transcript before running the AI analysis.
                Go to the Transcript tab and click "Generate Transcript".
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-medium text-lg text-indigo-800 mb-2">What Will Google Gemini Analyze?</h3>
                <p className="text-indigo-700 mb-4">
                  Google's Gemini AI will analyze the transcript for language patterns:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-indigo-600">
                  <li>Rhetorical devices (tricolon, anaphora, hexacolon, etc.)</li>
                  <li>Language patterns (filler words, repetition, etc.)</li>
                  <li>Speech structure (flow, adapted language, etc.)</li>
                </ul>
              </div>
              
              <div className="flex flex-col items-center justify-center mt-6">
                <div className="flex items-center justify-center w-full">
                  <ArrowDown className="h-14 w-14 animate-bounce text-red-500" />
                </div>
                <div className="text-center font-bold text-red-800 text-2xl mb-2 mt-0">
                  CLICK THIS BUTTON
                </div>
              </div>
              
              {/* MAIN ANALYSIS BUTTON - EXTREMELY OBVIOUS */}
              <div className="flex flex-col items-center justify-center py-8 bg-red-600 border-4 border-red-800 rounded-xl">
                <Button 
                  size="lg"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || !hasTranscript}
                  className="w-full max-w-lg h-24 text-2xl font-bold bg-white hover:bg-gray-100 text-red-600 flex items-center justify-center gap-4 shadow-lg animate-pulse hover:animate-none"
                >
                  <PlayCircle className="h-10 w-10" />
                  {isAnalyzing ? (
                    <>ANALYZING WITH GOOGLE GEMINI...</>
                  ) : (
                    <>RUN GOOGLE GEMINI AI ANALYSIS</>
                  )}
                </Button>
                <p className="mt-4 text-white font-medium text-lg">
                  This will send the transcript to Google Gemini AI for analysis
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-red-100 p-4 text-center">
          <p className="text-red-700 text-sm">
            Language skills evaluation requires Google's Gemini AI model
          </p>
        </CardFooter>
      </Card>
      
      {isAnalyzing && (
        <Card className="mt-6 border-2 border-indigo-500">
          <CardHeader className="bg-indigo-600 text-white">
            <CardTitle className="flex items-center">
              <span className="mr-2 h-3 w-3 rounded-full bg-white animate-pulse"></span>
              Processing with Google Gemini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="w-20 h-20 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin"></div>
            </div>
            <p className="text-center text-indigo-700 text-lg">
              Sending transcript to Google Gemini API and processing results...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
