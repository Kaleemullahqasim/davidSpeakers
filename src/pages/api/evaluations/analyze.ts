import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { languageSkills } from '@/lib/skillsData';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, audience } = req.body;
    
    if (!evaluationId) {
      return res.status(400).json({ message: 'Evaluation ID is required' });
    }

    console.log(`Starting Google Gemini AI analysis for evaluation ${evaluationId}`);
    console.log(`Audience information: ${audience || "None provided"}`);
    
    // Get the evaluation data including transcript
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('video_id, results')
      .eq('id', evaluationId)
      .single();
    
    if (evalError || !evaluation) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Get transcript from the results
    const transcript = evaluation.results?.transcript;
    
    if (!transcript) {
      return res.status(400).json({ message: 'No transcript found for this evaluation' });
    }
    
    // Extract audience info from request or evaluation
    const audienceInfo = audience || evaluation.results?.audience || "";
    
    console.log(`Using audience information: "${audienceInfo}"`);
    console.log(`Transcript length: ${transcript.length} characters`);
    
    // Use the imported languageSkills array
    if (!languageSkills || languageSkills.length === 0) {
      return res.status(500).json({ message: 'Failed to load language skills definitions' });
    }
    
    console.log(`Analyzing ${languageSkills.length} language skills`);
    
    // Analyze the transcript using Google Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Build the prompt with audience information and explicit skill IDs
    const prompt = `
      You are an expert speech coach analyzing a transcript of a speech. 
      ${audienceInfo ? `The speech is intended for the following audience: ${audienceInfo}` : 'No specific audience information was provided.'}
      
      Please analyze the following speech transcript and evaluate each language skill.
      For each skill, provide a score and a brief explanation of why you assigned that score.
      
      Here are the skills to evaluate (format: ID. Skill Name):
      ${languageSkills.map((skill: any) => 
        `${skill.id}. ${skill.name}`
      ).join('\n')}
      
      For good skills (where a higher score is better), score from 0 (poor) to 10 (excellent).
      For bad skills (where presence is negative), score from -10 (very present) to 0 (not present).
      
      Respond in JSON format as follows:
      {
        "85": {
          "score": number,
          "explanation": "brief explanation"
        },
        "86": {
          "score": number,
          "explanation": "brief explanation"
        },
        // and so on for all skill IDs
      }
      
      Here is the transcript:
      "${transcript}"
      
      JSON response only, no other text:
    `;
    
    console.log("Sending prompt to Google Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    let analysis;
    try {
      // Extract JSON if it's wrapped in backticks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      analysis = JSON.parse(jsonString);
      
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', text);
      return res.status(500).json({ 
        message: 'Failed to parse AI response', 
        rawResponse: text 
      });
    }
    
    // Structure the analysis results
    const structuredAnalysis: Record<string, any> = {};
    
    for (const [skillId, data] of Object.entries(analysis) as [string, any][]) {
      const skill = languageSkills.find((s: any) => s.id.toString() === skillId);
      if (skill) {
        structuredAnalysis[skill.id.toString()] = {
          name: skill.name,
          score: data.score,
          explanation: data.explanation,
          isGoodSkill: skill.isGoodSkill
        };
      }
    }
    
    // Update the evaluation with the analysis results
    const { error: updateError } = await supabase
      .from('evaluations')
      .update({
        results: {
          ...evaluation.results,
          analysis: {
            ...evaluation.results?.analysis,
            language: structuredAnalysis
          },
          audience: audienceInfo || evaluation.results?.audience // Ensure audience is saved
        }
      })
      .eq('id', evaluationId);
    
    if (updateError) {
      console.error('Error updating evaluation with analysis:', updateError);
      return res.status(500).json({ message: 'Failed to save analysis results' });
    }
    
    return res.status(200).json({ 
      message: 'Google Gemini AI analysis completed successfully',
      analysis: structuredAnalysis
    });
    
  } catch (error) {
    console.error('Error analyzing with Google Gemini:', error);
    return res.status(500).json({ 
      message: 'Failed to analyze with Google Gemini',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
