import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchEvaluation } from '@/lib/api';
import { fetchWithAuth } from '@/lib/auth-helpers';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Import components from coach directory
import { LanguageTabContent } from '@/components/coach/LanguageTabContent';
import { AIScoreTable } from '@/components/coach/AIScoreTable';
import { ManualScoringTable } from '@/components/coach/ManualScoringTable';
import { EvaluationOverviewSection } from '@/components/coach/EvaluationOverviewSection';
import { TranscriptSection } from '@/components/coach/TranscriptSection';
import { FeedbackSection } from '@/components/coach/FeedbackSection';
import { FloatingVideoPlayer } from '@/components/coach/FloatingVideoPlayer';
import { StartReviewSection } from '@/components/coach/StartReviewSection';
import { ComponentErrorFallback } from '@/components/coach/Fallbacks';
import { ScoreSummaryTab } from '@/components/coach/ScoreSummaryTab';
import { CriticalSkillsTab } from '@/components/coach/CriticalSkillsTab';

// Manual scores interface
interface ManualScores {
  nervousness: { score: number; notes?: string };
  voice: { score: number; notes?: string };
  body_language: { score: number; notes?: string };
  expressions: { score: number; notes?: string };
  ultimate_level: { score: number; notes?: string };
}

function CoachEvaluationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  // State variables in a logical order
  const [activeTab, setActiveTab] = useState('overview');
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [adjustedScores, setAdjustedScores] = useState<{[key: string]: number}>({});
  const [audienceInfo, setAudienceInfo] = useState('');
  const [criticalSkills, setCriticalSkills] = useState<string[]>([]);
  const [manualScores, setManualScores] = useState<ManualScores>({
    nervousness: { score: 5 },
    voice: { score: 5 },
    body_language: { score: 5 },
    expressions: { score: 5 },
    ultimate_level: { score: 5 }
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [videoPlayerPosition, setVideoPlayerPosition] = useState({ x: 20, y: 20 });
  const [lastScoreUpdate, setLastScoreUpdate] = useState<Date>(new Date());
  // Fetch the evaluation data
  const { data: evaluation, isLoading, error, refetch } = useQuery({
    queryKey: ['coach-evaluation', id],
    queryFn: () => fetchEvaluation(id as string),
    enabled: !!id && !!user && user.role === 'coach'
  });

  // Initialize state from evaluation data when it loads
  useEffect(() => {
    if (evaluation) {
      console.log("Evaluation data loaded:", evaluation);
      if (evaluation.results?.transcript) {
        setTranscript(evaluation.results.transcript);
      }
      if (evaluation.coach_feedback) {
        setCoachFeedback(evaluation.coach_feedback);
      }
      if (evaluation.results?.audience) {
        setAudienceInfo(evaluation.results.audience);
      }
      if (evaluation.results?.manual_scores) {
        setManualScores(evaluation.results.manual_scores);
        console.log("Manual scores loaded:", evaluation.results.manual_scores);
      }
      if (evaluation.results?.critical_skills) {
        setCriticalSkills(evaluation.results.critical_skills);
        console.log("Critical skills loaded:", evaluation.results.critical_skills);
      }
      if (evaluation.results?.adjusted_analysis) {
        setAdjustedScores(evaluation.results.adjusted_analysis);
      }
    }
  }, [evaluation]);
  
  // Derived state - Improve the hasAnalysis check to verify actual content
  const hasTranscript = !!transcript && transcript.length > 0;
  const hasAnalysis = evaluation?.results?.analysis && 
    Object.keys(evaluation.results.analysis).length > 0 && 
    Object.values(evaluation.results.analysis).some(skill => 
      skill && typeof skill === 'object' && Object.keys(skill).length > 0
    );
  const isCompleted = evaluation?.status === 'reviewed';
  const isReviewing = evaluation?.status === 'review_requested';
  const canSubmitReview = hasTranscript && coachFeedback.trim().length > 0;
  // Generate chart data for the overview
  const chartData = hasAnalysis
    ? Object.entries(evaluation.results.analysis).map(([skill, data]: [string, any]) => ({
        skill: skill.replace(/_/g, ' '),
        score: data.score,
        adjustedScore: adjustedScores[skill] !== undefined ? adjustedScores[skill] : data.score
      }))
    : [];
  // Log evaluation state once for debugging 
  const logDebugInfo = useCallback(() => {
    if (process.env.NODE_ENV !== 'production' && evaluation) {
      console.log("Coach view - Evaluation state:", {
        id,
        status: evaluation.status,
        hasTranscript,
        hasAnalysis,
        isCompleted,
        hasManualScores: !!evaluation.results?.manual_scores,
        hasCriticalSkills: !!evaluation.results?.critical_skills,
        hasFeedback: !!evaluation.coach_feedback
      });
    }
  }, [id, evaluation, hasTranscript, hasAnalysis, isCompleted]);

  useEffect(() => {
    logDebugInfo();
  }, [logDebugInfo]);

  // Redirect if user isn't a coach
  useEffect(() => {
    if (!loading && (!user || user.role !== 'coach')) {
      router.push('/login');
    }
  }, [user, loading, router]);
  const handleStartReview = async () => {
    setIsStartingReview(true);
    try {
      const response = await fetchWithAuth('/api/evaluations/update-status', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: id,
          status: 'coach_reviewing'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start review');
      }
      
      await refetch();
      toast({
        title: 'Review started',
        description: 'You can now review this speech evaluation',
      });
    } catch (error) {
      console.error('Error starting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to start review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStartingReview(false);
    }
  };

  const handleTranscribe = async () => {
    if (!evaluation?.video_id) {
      toast({
        title: 'Error',
        description: 'No video ID found for this evaluation',
        variant: 'destructive',
      });
      return;
    }
    
    setIsTranscribing(true);
    try {
      const response = await fetchWithAuth('/api/evaluations/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: id,
          videoId: evaluation.video_id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to transcribe video');
      }
      
      const data = await response.json();
      setTranscript(data.transcript);
      
      toast({
        title: 'Transcription complete',
        description: 'Video has been successfully transcribed',
      });
      
      await refetch();
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: error instanceof Error ? error.message : 'Failed to transcribe video',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    console.log("Google Gemini Analysis completed!", analysis);
    console.log("Analysis keys:", Object.keys(analysis).length);
    console.log("First analysis item:", Object.entries(analysis)[0]);
    toast({
      title: "Google Gemini Analysis Complete",
      description: "The language analysis has been processed successfully with " + 
        Object.keys(analysis).length + " skills analyzed.",
      duration: 5000,
    });
    
    // Force refetch to ensure we have the latest data
    refetch();
  };

  const handleScoreChange = (skill: string, score: number) => {
    setAdjustedScores(prev => ({
      ...prev,
      [skill]: score
    }));
    setHasUnsavedChanges(true);
    notifyScoreUpdate();
  };

  const handleSubmitReview = async () => {
    if (!canSubmitReview) {
      toast({
        title: 'Cannot submit review',
        description: 'Please complete transcript and feedback before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    notifyScoreUpdate();
    try {
      console.log("Submitting review with:", {
        manualScores,
        criticalSkills,
        hasAdjustedScores: Object.keys(adjustedScores).length > 0,
        feedbackLength: coachFeedback.length
      });
      
      const response = await fetchWithAuth('/api/evaluations/update-status', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: id,
          status: 'published',
          feedback: coachFeedback,
          manualScores: manualScores,
          criticalSkills: criticalSkills,
          adjustedScores: adjustedScores
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
      
      toast({
        title: 'Review published',
        description: 'Your review has been submitted and is now available to the student',
      });
      
      router.push('/dashboard/coach/evaluations');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a confirm prompt when leaving the page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are any unsaved changes (you'll need to track this in state)
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes that will be lost if you leave this page.';
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Add a tab change handler to prompt saving before switching tabs
  const handleTabChange = (newTab: string) => {
    // Check if there are unsaved changes in the current active tab
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Do you want to continue without saving?');
      if (!confirmLeave) {
        return;
      }
    }
    
    // If switching to summary tab, refresh evaluation data
    if (newTab === 'summary') {
      // Notify the component to refresh
      setLastScoreUpdate(new Date());
      
      // Force a refetch of evaluation data to ensure the latest scores are displayed
      refetch();
    }
    
    // Switch to the new tab
    setActiveTab(newTab);
  };

  // Toggle video player visibility
  const toggleVideoPlayer = () => {
    setVideoPlayerVisible(!videoPlayerVisible);
  };

  // Add a video player button to the header
  const renderVideoPlayerButton = () => {
    if (!evaluation?.video_id) return null;
    return (
      <Button
        variant={videoPlayerVisible ? "default" : "outline"}
        size="sm"
        onClick={toggleVideoPlayer}
        className="ml-2"
      >
        {videoPlayerVisible ? "Hide Video" : "Show Video"}
      </Button>
    );
  };

  // Function to notify the ScoreSummaryTab about score updates
  const notifyScoreUpdate = () => {
    setLastScoreUpdate(new Date());
    
    // Refresh the evaluation data to ensure we have the latest scores
    refetch();
    
    // Show toast notification
    toast({
      title: "Scores Updated",
      description: "Score data has been updated. Check the Summary tab for the latest scores.",
      duration: 5000
    });
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !evaluation) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Evaluation Error</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard/coach/evaluations')}>
              Back to Evaluations
            </Button>
          </div>
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error Loading Evaluation</h2>
              <p className="text-gray-600">
                {error instanceof Error ? error.message : 'An error occurred loading this evaluation'}
              </p>
              <Button 
                onClick={() => refetch()}
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Main render
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Debug Banner for Troubleshooting */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium">Evaluation Status:</h2>
              <p className="text-sm text-gray-600">
                ID: {id} | 
                Status: {evaluation.status} | 
                Has Transcript: {hasTranscript ? "✅" : "❌"} | 
                Has Analysis: {hasAnalysis ? "✅" : "❌"}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log("Full evaluation data:", evaluation);
                toast({
                  title: "Debug Info",
                  description: `Status: ${evaluation.status}, Tab: ${activeTab}`,
                });
              }}
            >
              Debug Info for Troubleshooting
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {evaluation.title || `Evaluation ${id?.toString().slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Student: {evaluation.users?.name || 'Unknown'}</span>
              <span>•</span>
              <Badge variant={isCompleted ? 'secondary' : isReviewing ? 'outline' : 'default'}>
                {evaluation.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {renderVideoPlayerButton()}
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/coach/evaluations')}
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* Content */}
        {isReviewing ? (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="nervousness" disabled={!hasTranscript}>Nervousness</TabsTrigger>
              <TabsTrigger value="voice" disabled={!hasTranscript}>Voice</TabsTrigger>
              <TabsTrigger value="bodyLanguage" disabled={!hasTranscript}>Body Language</TabsTrigger>
              <TabsTrigger value="expressions" disabled={!hasTranscript}>Expressions</TabsTrigger>
              <TabsTrigger value="language" disabled={!hasTranscript} className="bg-red-100 text-red-800 font-bold">
                Language (AI)
              </TabsTrigger>
              <TabsTrigger value="ultimateLevel" disabled={!hasTranscript}>Ultimate Level</TabsTrigger>
              <TabsTrigger value="summary" disabled={!hasTranscript}>Summary</TabsTrigger>
              <TabsTrigger value="criticalSkills" disabled={!hasTranscript}>Critical Skills</TabsTrigger>
              <TabsTrigger value="feedback" disabled={!hasTranscript}>Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 mt-6">
              <EvaluationOverviewSection 
                evaluation={evaluation}
                chartData={chartData}
                hasTranscript={hasTranscript}
                onTranscribe={handleTranscribe}
                isTranscribing={isTranscribing}
                onGoToTranscript={() => setActiveTab('transcript')}
              />
            </TabsContent>
            <TabsContent value="transcript" className="mt-6">
              <TranscriptSection 
                transcript={transcript}
                isTranscribing={isTranscribing}
                onTranscribe={handleTranscribe}
                onToggleVideo={() => setVideoPlayerVisible(!videoPlayerVisible)}
                videoPlayerVisible={videoPlayerVisible}
                audienceInfo={audienceInfo}
              />
            </TabsContent>
            <TabsContent value="nervousness" className="space-y-4">
              <ManualScoringTable 
                evaluationId={id as string} 
                skillType="nervousness" 
                onScoresSaved={notifyScoreUpdate}
              />
            </TabsContent>
            <TabsContent value="voice" className="space-y-4">
              <ManualScoringTable 
                evaluationId={id as string} 
                skillType="voice" 
                onScoresSaved={notifyScoreUpdate}
              />
            </TabsContent>
            <TabsContent value="bodyLanguage" className="space-y-4">
              <ManualScoringTable 
                evaluationId={id as string} 
                skillType="bodyLanguage" 
                onScoresSaved={notifyScoreUpdate}
              />
            </TabsContent>
            <TabsContent value="expressions" className="space-y-4">
              <ManualScoringTable 
                evaluationId={id as string} 
                skillType="expressions" 
                onScoresSaved={notifyScoreUpdate}
              />
            </TabsContent>
            <TabsContent value="language" className="space-y-4">
              <Card className="mb-4 border-4 border-red-500">
                <CardHeader className="bg-red-100">
                  <CardTitle>Google Gemini AI Analysis</CardTitle>
                  <CardDescription>
                    This section uses Google Gemini to analyze language patterns and rhetorical devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {typeof LanguageTabContent !== 'undefined' ? (
                    <LanguageTabContent 
                      evaluationId={id as string}
                      hasAnalysis={hasAnalysis}
                      hasTranscript={hasTranscript}
                      evaluation={evaluation}
                      isAnalyzing={isAnalyzing}
                      onAnalysisComplete={handleAnalysisComplete}
                      audienceInfo={audienceInfo}
                    />
                  ) : (
                    <ComponentErrorFallback componentName="LanguageTabContent" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ultimateLevel" className="space-y-4">
              <ManualScoringTable 
                evaluationId={id as string} 
                skillType="ultimateLevel" 
                onScoresSaved={notifyScoreUpdate}
              />
            </TabsContent>
            <TabsContent value="summary" className="space-y-4">
              <ScoreSummaryTab 
                evaluation={{...evaluation, refetch}} // Pass refetch function to allow refreshing from the component
                refreshTrigger={lastScoreUpdate} 
              />
            </TabsContent>
            <TabsContent value="criticalSkills" className="space-y-4">
              <CriticalSkillsTab 
                evaluationId={id as string}
                existingCriticalSkills={evaluation.results?.critical_skills || []} 
              />
            </TabsContent>
            <TabsContent value="feedback" className="mt-6">
              <FeedbackSection 
                coachFeedback={coachFeedback}
                onChange={setCoachFeedback}
                onSubmit={handleSubmitReview}
                isSubmitting={isSubmitting}
                isCompleted={isCompleted}
                hasTranscript={hasTranscript}
                onGoToTranscript={() => setActiveTab('transcript')}
              />
            </TabsContent>
          </Tabs>
        ) : isCompleted ? (
          // Completed view - Show all tabs in read-only mode
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="nervousness">Nervousness</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="bodyLanguage">Body Language</TabsTrigger>
              <TabsTrigger value="expressions">Expressions</TabsTrigger>
              <TabsTrigger value="language">Language</TabsTrigger>
              <TabsTrigger value="ultimateLevel">Ultimate Level</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Evaluation</CardTitle>
                  <CardDescription>
                    You completed this evaluation on {evaluation.completed_at ? 
                      new Date(evaluation.completed_at).toLocaleDateString() : 'unknown date'}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>YouTube ID:</strong> {evaluation.video_id}<br />
                    <strong>Student:</strong> {evaluation.users?.name || 'Unknown'}<br />
                    <strong>Completed:</strong> {evaluation.completed_at ? 
                      new Date(evaluation.completed_at).toLocaleString() : 'Unknown'}
                  </p>
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      You can review the student's video, transcript, your analysis, and feedback by exploring the tabs.
                    </p>
                  </div>
                        
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard/coach/evaluations')}
                    >
                      Back to Evaluations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Other tab contents for completed view */}
          </Tabs>
        ) : (
          <StartReviewSection
            onStartReview={handleStartReview}
            isStarting={isStartingReview}
          />
        )}
        
        {/* Floating Video Player - displayed regardless of the active tab */}
        {videoPlayerVisible && evaluation?.video_id && (
          <FloatingVideoPlayer
            videoId={evaluation.video_id}
            onClose={() => setVideoPlayerVisible(false)}
            initialPosition={videoPlayerPosition}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default CoachEvaluationDetail;