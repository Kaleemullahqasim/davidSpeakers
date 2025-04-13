import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StartReviewSectionProps {
  onStartReview: () => void;
  isStarting: boolean;
}

export function StartReviewSection({ onStartReview, isStarting }: StartReviewSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Review</CardTitle>
        <CardDescription>
          Begin reviewing this speech submission
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          You've been assigned to review this speech. Click "Start Review" to begin the evaluation process.
          First, you'll need to transcribe the video, then you can provide feedback and adjust scores.
        </p>
        <Button 
          onClick={onStartReview}
          disabled={isStarting}
        >
          {isStarting ? 'Starting...' : 'Start Review'}
        </Button>
      </CardContent>
    </Card>
  );
}
