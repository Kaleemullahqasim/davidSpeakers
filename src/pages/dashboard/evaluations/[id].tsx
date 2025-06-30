import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchEvaluation } from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Award, Star, PlayCircle, ScrollText, BarChart3, MessageSquare } from 'lucide-react';
import {
  getParentClassForSkill,
  nervousnessSkills,
  voiceSkills,
  bodyLanguageSkills,
  expressionsSkills,
  languageSkills,
  ultimateLevelSkills
} from '@/lib/skillsData';

// Import components
import { StudentVideoPlayer } from '@/components/student/StudentVideoPlayer';
import { SkillCategoryCard } from '@/components/student/SkillCategoryCard';
import { OverviewDashboard } from '@/components/student/OverviewDashboard';
import { TranscriptCard } from '@/components/student/TranscriptCard';
import { CoachFeedbackCard } from '@/components/student/CoachFeedbackCard';
import { CriticalSkillsList } from '@/components/student/CriticalSkillsList';

function EvaluationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  
  // State variables
  const [activeTab, setActiveTab] = useState('overview');
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [videoPlayerPosition, setVideoPlayerPosition] = useState({ x: 20, y: 20 });

  // Fetch the evaluation data
  const { data: evaluation, isLoading, error } = useQuery({
    queryKey: ['student-evaluation', id],
    queryFn: () => fetchEvaluation(id as string),
    enabled: !!id && !!user && user.role === 'student',
  });

  // Derived state
  const hasTranscript = evaluation?.results?.transcript && evaluation.results.transcript.length > 0;
  const isCompleted = evaluation?.status === 'published';
  const hasCoachFeedback = !!evaluation?.coach_feedback;
  const hasCriticalSkills = evaluation?.results?.critical_skills && 
                          evaluation.results.critical_skills.length > 0;
  
  // Toggle video player visibility
  const toggleVideoPlayer = () => {
    setVideoPlayerVisible(!videoPlayerVisible);
  };
  
  // Redirect if user isn't a student or tries to access an evaluation that's not theirs
  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    } else if (evaluation && evaluation.user_id !== user?.id) {
      router.push('/dashboard/evaluations');
    }
  }, [user, loading, router, evaluation]);

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
            <h1 className="text-2xl font-bold">Evaluation Not Found</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard/evaluations')}>
              Back to My Evaluations
            </Button>
          </div>
          
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Evaluation Not Available</h2>
              <p className="text-gray-600">
                {error instanceof Error ? error.message : 'The requested evaluation could not be found or accessed.'}
              </p>
              <Button 
                onClick={() => router.push('/dashboard/evaluations')}
                className="mt-4"
              >
                Return to Evaluations
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // If the evaluation isn't completed yet
  if (!isCompleted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{evaluation.title || 'Evaluation'}</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard/evaluations')}>
              Back to My Evaluations
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Evaluation in Progress</CardTitle>
              <CardDescription>
                Your coach is currently reviewing your submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6 text-center">
              <div className="w-16 h-16 border-4 border-t-primary border-primary/30 rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-bold mb-2">Coach Review in Progress</h2>
              <p className="text-gray-600 mb-4">
                Your coach is analyzing your speech and preparing detailed feedback.
                You'll be notified once the evaluation is complete.
              </p>
              <Badge variant="outline" className="mx-auto">
                Status: {evaluation.status.replace(/_/g, ' ')}
              </Badge>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/dashboard/evaluations')}>
                Return to My Evaluations
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Main render for completed evaluations
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {evaluation.title || `Evaluation ${id?.toString().slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Completed: {new Date(evaluation.completed_at || Date.now()).toLocaleDateString()}</span>
              <span>•</span>
              <Badge variant="secondary">
                Completed
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={videoPlayerVisible ? "default" : "outline"}
              size="sm"
              onClick={toggleVideoPlayer}
            >
              {videoPlayerVisible ? "Hide Video" : "Show Video"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/evaluations')}
            >
              Back to My Evaluations
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transcript" className="flex items-center gap-1">
              <ScrollText className="h-4 w-4" />
              <span>Transcript</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>Skills Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Coach Feedback</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <OverviewDashboard 
              evaluation={evaluation} 
              onToggleVideo={toggleVideoPlayer}
            />
            
            {hasCriticalSkills && (
              <CriticalSkillsList 
                criticalSkills={evaluation.results.critical_skills}
              />
            )}
            
            {hasCoachFeedback && (
              <CoachFeedbackCard 
                feedback={evaluation.coach_feedback}
                coachName={evaluation.coach?.name || 'Coach'}
              />
            )}
          </TabsContent>
          
          <TabsContent value="transcript" className="space-y-4">
            <TranscriptCard 
              transcript={evaluation.results?.transcript || ''} 
              audienceInfo={evaluation.results?.audience || ''}
            />
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkillCategoryCard 
                title="Nervousness" 
                skills={nervousnessSkills}
                scores={evaluation.results?.skill_scores}
                showDescription={true}
              />
              
              <SkillCategoryCard 
                title="Voice" 
                skills={voiceSkills}
                scores={evaluation.results?.skill_scores}
              />
              
              <SkillCategoryCard 
                title="Body Language" 
                skills={bodyLanguageSkills}
                scores={evaluation.results?.skill_scores}
              />
              
              <SkillCategoryCard 
                title="Expressions" 
                skills={expressionsSkills}
                scores={evaluation.results?.skill_scores}
              />
              
              <SkillCategoryCard 
                title="Language" 
                skills={languageSkills}
                scores={evaluation.results?.skill_scores}
              />
              
              <SkillCategoryCard 
                title="Ultimate Level" 
                skills={ultimateLevelSkills}
                scores={evaluation.results?.skill_scores}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            {hasCoachFeedback ? (
              <CoachFeedbackCard 
                feedback={evaluation.coach_feedback}
                coachName={evaluation.coach?.name || 'Coach'}
                expanded={true}
              />
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">No coach feedback available yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Floating video player */}
        {videoPlayerVisible && evaluation.video_id && (
          <StudentVideoPlayer
            videoId={evaluation.video_id}
            onClose={() => setVideoPlayerVisible(false)}
            initialPosition={videoPlayerPosition}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default EvaluationDetail;
