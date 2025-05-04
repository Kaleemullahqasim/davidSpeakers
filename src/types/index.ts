export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'coach' | 'admin';
  avatarUrl?: string;
};

export type VideoSubmission = {
  id: string;
  studentId: string;
  youtubeUrl: string;
  targetAudience: string;
  comments?: string;
  status: 'pending' | 'processing' | 'evaluated';
  submittedAt: Date;
  evaluatedAt?: Date;
};

export type LanguageSkill = {
  name: string;
  score: number;
  aiScore: number;
  frequency?: number;
  category: 'clarity' | 'engagement' | 'structure' | 'delivery' | 'vocabulary' | 'grammar';
};

export type Evaluation = {
  id: string;
  submissionId: string;
  coachId: string;
  skills: LanguageSkill[];
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
};