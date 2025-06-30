import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoIcon, ExternalLink } from 'lucide-react';

interface FeedbackSectionProps {
  coachFeedback: string;
  feedbackVideoUrl: string;
  onChange: (feedback: string) => void;
  onVideoUrlChange: (url: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isCompleted: boolean;
  hasTranscript: boolean;
  onGoToTranscript: () => void;
}

export function FeedbackSection({
  coachFeedback,
  feedbackVideoUrl,
  onChange,
  onVideoUrlChange,
  onSubmit,
  isSubmitting,
  isCompleted,
  hasTranscript,
  onGoToTranscript
}: FeedbackSectionProps) {
  // Function to validate YouTube URL
  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  // Function to extract video ID from YouTube URL for preview
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(feedbackVideoUrl);
  const isValidUrl = isValidYouTubeUrl(feedbackVideoUrl);

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
      <CardContent className="space-y-6">
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
            {/* Written Feedback Section */}
            <div className="space-y-2">
              <Label htmlFor="written-feedback">Written Feedback</Label>
              <Textarea
                id="written-feedback"
                placeholder="Share your expertise and insights with the student based on their speech performance..."
                className="min-h-[300px]"
                value={coachFeedback}
                onChange={(e) => onChange(e.target.value)}
                disabled={isCompleted || !hasTranscript}
              />
              <div className="text-sm text-gray-500">
                <p>Focus on both strengths and areas for improvement. Be specific and provide actionable advice.</p>
              </div>
            </div>

            {/* Video Feedback Section */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-blue-600" />
                <Label htmlFor="video-feedback">Video Feedback (Optional)</Label>
              </div>
              <div className="space-y-2">
                <Input
                  id="video-feedback"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={feedbackVideoUrl}
                  onChange={(e) => onVideoUrlChange(e.target.value)}
                  disabled={isCompleted || !hasTranscript}
                  className={!isValidUrl ? 'border-red-300 focus:border-red-500' : ''}
                />
                <div className="text-sm text-gray-500">
                  <p>Add a YouTube video link to provide personalized video feedback to the student.</p>
                </div>
                
                {/* URL Validation Feedback */}
                {feedbackVideoUrl && !isValidUrl && (
                  <div className="text-sm text-red-600">
                    Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)
                  </div>
                )}
                
                {/* Video Preview */}
                {feedbackVideoUrl && isValidUrl && videoId && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Video Preview:</span>
                      <a 
                        href={feedbackVideoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        Open in YouTube <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="aspect-video w-full max-w-md">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="Feedback Video Preview"
                        style={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={true}
                        className="rounded"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      {!isCompleted && hasTranscript && (
        <CardFooter className="flex justify-end">
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting || !coachFeedback.trim() || (!!feedbackVideoUrl && !isValidUrl)}
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Publish Review'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
