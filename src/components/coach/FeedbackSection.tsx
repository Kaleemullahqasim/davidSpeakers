import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackSectionProps {
  coachFeedback: string;
  onChange: (feedback: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isCompleted: boolean;
  hasTranscript: boolean;
  onGoToTranscript: () => void;
}

export function FeedbackSection({
  coachFeedback,
  onChange,
  onSubmit,
  isSubmitting,
  isCompleted,
  hasTranscript,
  onGoToTranscript
}: FeedbackSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start space-y-0">
        <div>
          <CardTitle>Coach Feedback</CardTitle>
          <CardDescription>
            Provide personalized feedback for the student
          </CardDescription>
        </div>
        {!hasTranscript && !isCompleted && (
          <Button 
            onClick={onGoToTranscript}
            variant="outline"
            className="ml-auto"
          >
            Transcribe First
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasTranscript && !isCompleted ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Transcription Required</h4>
            <p className="text-sm text-yellow-700">
              You need to transcribe the video before providing feedback.
              Please go to the Transcript tab to generate a transcript.
            </p>
          </div>
        ) : (
          <>
            <Textarea
              placeholder="Share your expertise and insights with the student based on their speech performance..."
              className="min-h-[300px]"
              value={coachFeedback}
              onChange={(e) => onChange(e.target.value)}
              disabled={isCompleted || !hasTranscript}
            />
            <div className="mt-2 text-sm text-gray-500">
              <p>Focus on both strengths and areas for improvement. Be specific and provide actionable advice.</p>
            </div>
          </>
        )}
      </CardContent>
      {!isCompleted && hasTranscript && (
        <CardFooter className="flex justify-end">
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting || !coachFeedback.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Publish Review'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
