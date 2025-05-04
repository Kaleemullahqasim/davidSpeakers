import React, { useState } from 'react';
import { VideoSubmission, LanguageSkill } from '../../types';
import { Search, Filter, Video, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const MOCK_SUBMISSIONS: VideoSubmission[] = [
  {
    id: '1',
    studentId: 'student1',
    youtubeUrl: 'https://youtube.com/watch?v=abc123',
    targetAudience: 'Technical Conference',
    comments: 'Looking for feedback on my presentation structure',
    status: 'pending',
    submittedAt: new Date('2024-02-20T10:00:00'),
  },
  {
    id: '2',
    studentId: 'student2',
    youtubeUrl: 'https://youtube.com/watch?v=def456',
    targetAudience: 'Sales Pitch',
    comments: 'Need help with engagement techniques',
    status: 'processing',
    submittedAt: new Date('2024-02-19T15:30:00'),
  },
  {
    id: '3',
    studentId: 'student3',
    youtubeUrl: 'https://youtube.com/watch?v=ghi789',
    targetAudience: 'Team Presentation',
    comments: 'Focus on clarity and delivery',
    status: 'pending',
    submittedAt: new Date('2024-02-18T09:15:00'),
  },
];

const INITIAL_SKILLS: LanguageSkill[] = [
  // Clarity Category
  { name: 'Pronunciation', score: 0, aiScore: 7.5, frequency: 15, category: 'clarity' },
  { name: 'Articulation', score: 0, aiScore: 8.2, frequency: 12, category: 'clarity' },
  { name: 'Speech Rate', score: 0, aiScore: 6.8, frequency: 8, category: 'clarity' },
  
  // Engagement Category
  { name: 'Eye Contact', score: 0, aiScore: 7.9, frequency: 20, category: 'engagement' },
  { name: 'Audience Interaction', score: 0, aiScore: 7.2, frequency: 10, category: 'engagement' },
  { name: 'Energy Level', score: 0, aiScore: 6.5, frequency: 18, category: 'engagement' },
  
  // Structure Category
  { name: 'Introduction', score: 0, aiScore: 7.8, frequency: 5, category: 'structure' },
  { name: 'Main Points', score: 0, aiScore: 8.0, frequency: 25, category: 'structure' },
  { name: 'Transitions', score: 0, aiScore: 7.1, frequency: 15, category: 'structure' },
  
  // Delivery Category
  { name: 'Voice Modulation', score: 0, aiScore: 7.4, frequency: 30, category: 'delivery' },
  { name: 'Body Language', score: 0, aiScore: 7.6, frequency: 22, category: 'delivery' },
  { name: 'Gestures', score: 0, aiScore: 6.9, frequency: 28, category: 'delivery' },
  
  // Vocabulary Category
  { name: 'Word Choice', score: 0, aiScore: 8.1, frequency: 40, category: 'vocabulary' },
  { name: 'Technical Terms', score: 0, aiScore: 7.7, frequency: 15, category: 'vocabulary' },
  { name: 'Filler Words', score: 0, aiScore: 6.4, frequency: 35, category: 'vocabulary' },
  
  // Grammar Category
  { name: 'Sentence Structure', score: 0, aiScore: 7.8, frequency: 20, category: 'grammar' },
  { name: 'Verb Tense', score: 0, aiScore: 8.2, frequency: 25, category: 'grammar' },
  { name: 'Agreement', score: 0, aiScore: 7.5, frequency: 18, category: 'grammar' },
];

export function CoachDashboard() {
  const [submissions, setSubmissions] = useState<VideoSubmission[]>(MOCK_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = useState<VideoSubmission | null>(null);
  const [skills, setSkills] = useState<LanguageSkill[]>(INITIAL_SKILLS);
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSubmissions = submissions.filter((submission) =>
    submission.youtubeUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.targetAudience.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(skills.map(skill => skill.category)));
  
  const filteredSkills = selectedCategory 
    ? skills.filter(skill => skill.category === selectedCategory)
    : skills;

  const handleSubmitEvaluation = () => {
    if (!selectedSubmission) return;
    
    const updatedSubmissions = submissions.map((sub) =>
      sub.id === selectedSubmission.id ? { ...sub, status: 'evaluated' as const } : sub
    );
    setSubmissions(updatedSubmissions);
    setSelectedSubmission(null);
    setFeedback('');
    setSkills(INITIAL_SKILLS);
    setIsMaximized(false);
  };

  const EvaluationInterface = () => (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${isMaximized ? 'fixed inset-4 z-50 overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Video Evaluation</h2>
        <button
          onClick={() => setIsMaximized(!isMaximized)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>

      {selectedSubmission && (
        <div className="space-y-6">
          <div className="aspect-video bg-gray-100 rounded-lg">
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${selectedSubmission.youtubeUrl.split('v=')[1]}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Language Skills Evaluation</h3>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="border rounded-md px-3 py-1"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <div key={skill.name} className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">{skill.name}</label>
                    <div className="text-xs text-gray-500">
                      <span className="mr-2">AI Score: {skill.aiScore}</span>
                      <span>Frequency: {skill.frequency}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={skill.score || skill.aiScore}
                    onChange={(e) => {
                      const newSkills = skills.map((s) =>
                        s.name === skill.name
                          ? { ...s, score: parseFloat(e.target.value) }
                          : s
                      );
                      setSkills(newSkills);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Provide detailed feedback..."
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitEvaluation}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isMaximized ? 'lg:grid-cols-1' : ''}`}>
        {/* Submissions List */}
        <div className={`bg-white rounded-lg shadow-lg p-6 ${isMaximized ? 'hidden' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Assigned Videos</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search submissions..."
                  className="pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button className="p-2 border rounded-md hover:bg-gray-50">
                <Filter className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Video className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Video className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {submission.targetAudience}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Submitted {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        submission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : submission.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>{submission.comments}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evaluation Interface */}
        <div className={isMaximized ? 'col-span-full' : ''}>
          <EvaluationInterface />
        </div>
      </div>
    </div>
  );
}