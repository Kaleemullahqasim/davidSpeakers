import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SkillsProgressChart } from './SkillsProgressChart';
import { CoachFeedbackVideoPlayer } from './CoachFeedbackVideoPlayer';
import { TrendingUp, MessageSquare } from 'lucide-react';

interface ProgressAndFeedbackSectionProps {
  currentEvaluationId: string;
  feedbackVideoUrl?: string | null;
  coachName?: string;
}

export function ProgressAndFeedbackSection({ 
  currentEvaluationId, 
  feedbackVideoUrl, 
  coachName 
}: ProgressAndFeedbackSectionProps) {
  return (
    <Card className="w-full bg-white">
      <CardHeader className="bg-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <div className="flex items-center mr-4">
            <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
            <span>Progress & Coach Feedback</span>
          </div>
        </CardTitle>
        <CardDescription>
          Track your improvement over time and watch personalized feedback from your coach
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Skills Progress Chart */}
          <div className="w-full">
            <SkillsProgressChart currentEvaluationId={currentEvaluationId} />
          </div>
          
          {/* Right Side: Coach Feedback Video Player */}
          <div className="w-full">
            <CoachFeedbackVideoPlayer 
              feedbackVideoUrl={feedbackVideoUrl}
              coachName={coachName}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 