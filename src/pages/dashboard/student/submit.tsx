import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { VideoUploadForm } from '@/components/student/VideoUploadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Info, CheckCircle } from 'lucide-react';

export default function StudentVideoSubmission() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Upload className="h-8 w-8 text-primary" />
            Video Submission
          </h1>
          <p className="text-gray-600">
            Submit your speech video for professional evaluation and feedback.
          </p>
        </div>

        {/* How It Works Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your journey from video submission to expert feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Submit Video</h3>
                  <p className="text-sm text-blue-700">
                    Paste your YouTube video URL and describe your intended audience
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">AI Analysis</h3>
                  <p className="text-sm text-blue-700">
                    Our AI analyzes your speech across 110+ speaking skills
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Expert Review</h3>
                  <p className="text-sm text-blue-700">
                    Professional coaches provide personalized feedback and scores
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Submission Form */}
        <div className="max-w-2xl">
          <VideoUploadForm />
        </div>

        {/* Tips Section */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Tips for Best Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Video Quality:</strong> Ensure clear audio and good lighting for accurate analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Speech Length:</strong> 3-10 minutes works best for comprehensive evaluation</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Audience Description:</strong> Be specific about your target audience for better "Adapted Language" scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>YouTube Settings:</strong> Make sure your video is public or unlisted (not private)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 