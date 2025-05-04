import React, { useState } from 'react';
import { PlusCircle, Video, AlertCircle } from 'lucide-react';
import { VideoSubmission } from '../../types';

export function StudentDashboard() {
  const [url, setUrl] = useState('');
  const [audience, setAudience] = useState('');
  const [comments, setComments] = useState('');
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    const newSubmission: VideoSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: 'current-user-id',
      youtubeUrl: url,
      targetAudience: audience,
      comments,
      status: 'pending',
      submittedAt: new Date(),
    };
    setSubmissions([newSubmission, ...submissions]);
    setUrl('');
    setAudience('');
    setComments('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Submit a Video for Review</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              YouTube Video URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </div>
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700">
              Target Audience
            </label>
            <input
              type="text"
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Technical conference attendees"
              required
            />
          </div>
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Additional Comments
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Any specific areas you'd like feedback on?"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Submit Video
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Your Submissions</h2>
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by submitting your first video!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Video className="h-5 w-5 text-gray-400 mr-2" />
                    <a
                      href={submission.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {submission.youtubeUrl}
                    </a>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'evaluated'
                      ? 'bg-green-100 text-green-800'
                      : submission.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p><strong>Target Audience:</strong> {submission.targetAudience}</p>
                  {submission.comments && (
                    <p className="mt-1"><strong>Comments:</strong> {submission.comments}</p>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}