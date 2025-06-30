import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Play, ExternalLink, Video } from 'lucide-react';

interface CoachFeedbackVideoPlayerProps {
  feedbackVideoUrl?: string | null;
  coachName?: string;
}

export function CoachFeedbackVideoPlayer({ 
  feedbackVideoUrl, 
  coachName = 'Your Coach' 
}: CoachFeedbackVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Check if URL is a valid YouTube URL
  const isYouTubeUrl = (url: string): boolean => {
    return /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(url);
  };

  // For demo purposes, use a placeholder video if no URL is provided
  const demoVideoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Roll as placeholder
  const videoUrl = feedbackVideoUrl || demoVideoUrl;
  const videoId = getYouTubeVideoId(videoUrl);
  const isDemo = !feedbackVideoUrl;

  if (!videoUrl && !isDemo) {
    return (
      <Card className="h-full bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
            Coach Video Feedback
          </CardTitle>
          <CardDescription>Personal video message from {coachName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="text-center p-6 max-w-sm">
              <Video className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No video feedback</h3>
              <p className="text-sm text-gray-600">
                No video feedback was provided for this evaluation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isYouTubeUrl(videoUrl) || !videoId) {
    return (
      <Card className="h-full bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
            Coach Video Feedback
          </CardTitle>
          <CardDescription>Personal video message from {coachName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="text-center p-6 max-w-sm">
              <Video className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid video URL</h3>
              <p className="text-sm text-gray-600 mb-4">
                The coach provided a video feedback URL, but it's not a valid YouTube link.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white">
      <CardHeader className="bg-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
          Coach Video Feedback
          {isDemo && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {isDemo 
            ? "Demo video - Real coach feedback will appear here when provided"
            : `Personal video message from ${coachName}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] w-full">
          {!isPlaying ? (
            // Thumbnail with play button
            <div 
              className="relative h-full w-full bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to medium quality thumbnail
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                <div className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-all transform group-hover:scale-110">
                  <Play className="h-8 w-8 ml-1" fill="currentColor" />
                </div>
              </div>
              {isDemo && (
                <div className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                  Demo Video
                </div>
              )}
            </div>
          ) : (
            // Embedded YouTube player
            <div className="h-full w-full rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title="Coach Video Feedback"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
        
        {/* Video controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            {isPlaying && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(false)}
              >
                Show Thumbnail
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://www.youtube.com/watch?v=${videoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in YouTube
              </a>
            </Button>
          </div>
        </div>
        
        {isDemo && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a demo video. When your coach provides video feedback, 
              it will appear here automatically.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 