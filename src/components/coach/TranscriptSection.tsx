import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon } from 'lucide-react';

interface TranscriptSectionProps {
  transcript?: string;
  isTranscribing: boolean;
  onTranscribe: () => void;
  onToggleVideo: () => void;
  videoPlayerVisible: boolean;
  audienceInfo?: string; // Add audience info prop
}

export function TranscriptSection({ 
  transcript, 
  isTranscribing, 
  onTranscribe, 
  onToggleVideo,
  videoPlayerVisible,
  audienceInfo
}: TranscriptSectionProps) {
  const hasTranscript = !!transcript && transcript.length > 0;
  const hasAudienceInfo = !!audienceInfo && audienceInfo.trim().length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start space-y-0">
        <div>
          <CardTitle>Speech Transcript</CardTitle>
          <CardDescription>
            {hasTranscript 
              ? 'Transcribed text from the student\'s video' 
              : 'No transcript available yet'}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={onToggleVideo}
          className="ml-auto"
        >
          {videoPlayerVisible ? 'Hide Video' : 'Show Video'}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Display audience information if available */}
        {hasAudienceInfo && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-700 mb-1">Intended Audience</h4>
              <p className="text-sm text-blue-600">{audienceInfo}</p>
              <p className="text-xs text-blue-500 mt-2">
                Consider how well the speaker adapts their language to this specific audience when evaluating.
              </p>
            </div>
          </div>
        )}

        {hasTranscript ? (
          <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
            {transcript}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="mb-4 text-gray-600">
              This video hasn't been transcribed yet. Transcription is required to proceed with your review.
            </p>
            <Button 
              onClick={onTranscribe}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <>
                  <span className="mr-2">Transcribing...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                'Generate Transcript'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
