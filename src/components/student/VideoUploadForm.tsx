import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { Info, HelpCircle } from 'lucide-react'; // Fixed import: InfoCircle -> Info

export function VideoUploadForm() {
  const [videoUrl, setVideoUrl] = useState('');
  const [audience, setAudience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL');
      return;
    }
    
    // YouTube URL validation
    if (!videoUrl.includes('youtube.com/') && !videoUrl.includes('youtu.be/')) {
      setError('Please provide a valid YouTube video URL');
      toast({
        title: 'Invalid URL',
        description: 'Please provide a valid YouTube video URL',
        variant: 'destructive',
      });
      return;
    }
    
    // Audience validation - make it required
    if (!audience.trim()) {
      setError('Please describe your intended audience');
      toast({
        title: 'Audience information required',
        description: 'Please describe who the speech was intended for',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Extract YouTube video ID
      let videoId = '';
      
      if (videoUrl.includes('youtube.com/watch?v=')) {
        const url = new URL(videoUrl);
        videoId = url.searchParams.get('v') || '';
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
      }
      
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }
      
      console.log('Submitting video with ID:', videoId);
      console.log('Audience information:', audience);
      
      // Call API to start evaluation with auth
      const response = await fetchWithAuth('/api/evaluations/create', {
        method: 'POST',
        body: JSON.stringify({ 
          videoId,
          audience // Include audience information in the request
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit video');
      }
      
      const data = await response.json();
      console.log('Submission response:', data);
      
      toast({
        title: 'Video submitted!',
        description: 'Your video is being processed. You will be notified when the evaluation is ready.',
      });
      
      // First navigate to the dashboard, then to the specific evaluation if available
      // This prevents issues with trying to access an evaluation that might not be immediately available
      router.push('/dashboard/student');
      
      // Optional: If we have an evaluationId and want to redirect to it after a delay
      // if (data.evaluationId) {
      //   setTimeout(() => {
      //     router.push(`/dashboard/student/evaluations/${data.evaluationId}`);
      //   }, 2000);
      // }
      
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit video');
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit video',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a New Video</CardTitle>
        <CardDescription>Paste a YouTube video URL to analyze your speech</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">YouTube Video URL</Label>
            <Input
              id="videoUrl"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
              className={error && !videoUrl ? "border-red-500" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="audience">Intended Audience</Label>
              <div className="relative group">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute z-10 invisible group-hover:visible bg-black text-white p-2 rounded text-xs w-64 -left-32 bottom-full mb-2">
                  Describing your audience helps us better evaluate how well you adapted your language to your listeners.
                  This improves the "Adapted Language" score in your analysis.
                </div>
              </div>
            </div>
            <Textarea
              id="audience"
              placeholder="Describe who your speech was intended for (e.g., 'business professionals in the tech industry', 'high school students interested in science', 'general public at a community event')"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              required
              className={error && !audience ? "border-red-500" : ""}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              This helps us assess how well you adapted your language to your specific audience.
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <Button type="submit" disabled={submitting} className="w-full md:w-auto">
            {submitting ? 'Submitting...' : 'Submit Video for Analysis'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-6 flex flex-col items-start">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" /> {/* Changed from InfoCircle to Info */}
          <div>
            <p className="font-medium text-gray-700">Why does audience matter?</p>
            <p className="mt-1">
              One of the key skills in effective speaking is "Adapted Language" - the ability to tailor your speech to your audience's knowledge, needs, and expectations. 
              Great speakers adjust their vocabulary, examples, and presentation style based on who's listening.
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
