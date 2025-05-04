import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoPlayerProps {
  videoId: string;
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video</CardTitle>
        <CardDescription>
          Watch the student's speech recording
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
