import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getYouTubeTranscript } from '@/lib/youtubeTranscription';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This API is not meant to be called directly from the client
  // It should be called from the create.ts API after creating an evaluation
  // For security, we'll use a simple API key check
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, videoId, userId } = req.body;

    if (!evaluationId || !videoId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1. Get the YouTube transcript
    const transcript = await getYouTubeTranscript(videoId);
    
    if (!transcript) {
      await updateEvaluationStatus(evaluationId, 'error', 'Failed to retrieve transcript');
      return res.status(400).json({ message: 'Failed to retrieve transcript' });
    }

    // 2. Fetch the skills and scoring rules from the database
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*');

    if (skillsError || !skills) {
      await updateEvaluationStatus(evaluationId, 'error', 'Failed to fetch skills data');
      return res.status(500).json({ message: 'Failed to fetch skills data' });
    }

    // 3. Analyze the transcript using Google Gemini
    const analysis = await analyzeTranscript(transcript, skills);

    // 4. Update the evaluation with the results
    await updateEvaluationWithResults(evaluationId, {
      transcript,
      analysis,
      video_title: await getYouTubeVideoTitle(videoId),
    });

    return res.status(200).json({ message: 'Evaluation processed successfully' });
  } catch (error) {
    console.error('Error processing evaluation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateEvaluationStatus(evaluationId: string, status: string, errorMessage?: string) {
  const { error } = await supabase
    .from('evaluations')
    .update({ 
      status,
      error_message: errorMessage
    })
    .eq('id', evaluationId);

  if (error) {
    console.error('Error updating evaluation status:', error);
  }
}

async function updateEvaluationWithResults(evaluationId: string, results: any) {
  const { error } = await supabase
    .from('evaluations')
    .update({ 
      status: 'completed',
      results,
      completed_at: new Date().toISOString(),
      title: results.video_title || `Evaluation ${evaluationId.slice(0, 8)}`
    })
    .eq('id', evaluationId);

  if (error) {
    console.error('Error updating evaluation with results:', error);
    throw error;
  }
}

async function analyzeTranscript(transcript: string, skills: any[]) {
  // Create skill categories lookup
  const skillCategories: { [key: string]: string[] } = {};
  skills.forEach((skill: any) => {
    if (!skillCategories[skill.category]) {
      skillCategories[skill.category] = [];
    }
    skillCategories[skill.category].push(skill.name);
  });

  // Create a prompt for Gemini that includes the transcript and the speech skills to analyze
  const prompt = `
    You are an AI speech analysis expert. Analyze the following transcript for different language skills and patterns.
    
    For each of the following language skill categories, identify occurrences and calculate scores:
    
    ${Object.entries(skillCategories).map(([category, skillNames]) => `
    ${category}:
    ${skillNames.map((name: any) => `- ${name}`).join('\n')}
    `).join('\n')}
    
    For each skill, provide:
    1. The specific words/phrases detected
    2. The frequency of occurrence for each word/phrase
    3. A score between -10 and 10 based on the skill's impact on the speech
    
    Format your response as a valid JSON object with the following structure:
    {
      "skill_name": {
        "words": ["detected phrase 1", "detected phrase 2"],
        "frequency": {"detected phrase 1": 5, "detected phrase 2": 3},
        "score": 5,
        "explanation": "Brief explanation of the score"
      }
    }
    
    TRANSCRIPT:
    ${transcript}
  `;

  // Call Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Parse the JSON from the response
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    throw new Error('Failed to parse AI analysis');
  }
}

async function getYouTubeVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title;
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching YouTube video title:', error);
    return '';
  }
}
