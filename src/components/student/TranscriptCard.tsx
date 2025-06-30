import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon, Users, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TranscriptCardProps {
  transcript: string;
  audienceInfo?: string;
  onToggleVideo?: () => void;
}

export function TranscriptCard({ transcript, audienceInfo, onToggleVideo }: TranscriptCardProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!transcript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Speech Transcript</CardTitle>
          <CardDescription>
            No transcript available for this evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            The transcript for this speech is not available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Speech Transcript</CardTitle>
            <CardDescription>
              Transcript of your speech automatically generated from the video
            </CardDescription>
          </div>
          <Button
            variant="outline" 
            size="sm"
            onClick={copyToClipboard}
            className="flex gap-1 items-center"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                <span>Copy Text</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {audienceInfo && (
        <div className="px-6 pb-2">
          <div className="flex items-start gap-2 p-3 bg-white rounded-md border border-gray-200">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Target Audience</p>
              <p className="text-sm text-blue-700">{audienceInfo}</p>
            </div>
          </div>
        </div>
      )}
      
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="whitespace-pre-wrap">{transcript}</div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          Character count: {transcript.length}
        </div>
        
        {onToggleVideo && (
          <Button variant="outline" size="sm" onClick={onToggleVideo}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Watch Video
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
