import { GoogleGenerativeAI } from "@google/generative-ai";
import { languageSkills } from '@/lib/skillsData';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);

/**
 * Analyzes a speech transcript using Google's Gemini AI
 * @param transcript The speech transcript text
 * @param audience The intended audience for the speech (optional)
 * @returns Speech analysis results with scores and explanations
 */
export async function analyzeSpeechTranscript(transcript: string, audience?: string) {
  try {
    console.log('Starting AI analysis of speech transcript...');
    console.log('Audience information:', audience || 'None provided');
    
    // Create the prompt with detailed instructions for analysis and explicit JSON formatting
    const prompt = `
      You are a professional speech analysis AI. Analyze the following speech transcript for 19 specific rhetorical skills and language patterns.
      
      For each skill, identify relevant words or phrases used in the transcript, count their frequency, and provide a score from -10 to +10 where:
      - Positive scores (1 to 10) indicate effective use of a positive skill
      - Negative scores (-1 to -10) indicate problematic use of a negative pattern
      - Zero (0) indicates neutral or balanced use
      
      Also provide a brief explanation for each score.
      
      ${audience ? `IMPORTANT - This speech was intended for the following audience: "${audience}". Pay special attention to how well the speaker adapts their language for this specific audience.` : ''}
      
      The 19 skills to analyze are:
      
      Structural Elements (positive skills):
      1. Adapted Language – Tailoring words to fit the audience and context.${audience ? ' Given the specified audience, evaluate how effectively the speaker adapts vocabulary, examples, and technical level to their needs.' : ''}
      2. Flow – Ensuring smooth and logical speech progression with transition words.
      3. Strong Rhetoric – Using persuasive and impactful language.
      4. Strategic Language – Choosing words that align with the speech's goal.
      5. Valued Language – Using words that evoke positive emotions or credibility.
      
      Filler Elements (negative patterns):
      6. Filler Language – Using unnecessary words like "you know" and "like."
      7. Negations – Using negative phrasing that reduces clarity.
      8. Repetitive Words – Overusing the same words in close proximity.
      9. Absolute Words – Overusing definitive terms like "always" and "never."
      10. Filler Sounds – Using vocal fillers like "um," "hmm," and "uh" that reduce fluency.
      
      Rhetorical Devices (positive skills):
      11. Hexacolon – Structuring ideas into six parallel phrases for rhythm.
      12. Tricolon – Using three parallel phrases for emphasis (e.g., "veni, vidi, vici").
      13. Repetition – Deliberately repeating key words or phrases for emphasis.
      14. Anaphora – Repeating a word at the start of successive clauses/sentences.
      15. Epiphora – Repeating a word at the end of successive clauses/sentences.
      16. Alliteration – Using similar starting sounds to make speech memorable.
      17. Correctio – Self-correcting in speech for precision ("not X, but Y").
      18. Climax – Gradually increasing intensity or importance to build impact.
      19. Anadiplosis – Repeating the last word of one clause/sentence at the start of the next.
      
      Transcript to analyze:
      """
      ${transcript}
      """
      
      Return your analysis in the following JSON format exactly with no additional text:
      
      {
        "analysis": {
          "adapted_language": {
            "words": ["example1", "example2", ...],
            "frequency": {"example1": 3, "example2": 2, ...},
            "score": 5,
            "explanation": "Brief explanation of the score..."
          },
          "flow": {
            "words": ["example1", "example2", ...],
            "frequency": {"example1": 3, "example2": 2, ...},
            "score": 5,
            "explanation": "Brief explanation of the score..."
          },
          ... and so on for all 19 skills ...
        }
      }
      
      Ensure you include all 19 skills, even if you don't find examples in the text. In such cases, provide an empty words array, empty frequency object, a score of 0, and an explanation noting the absence of the skill.
      Return only valid JSON with no additional text before or after. All property names should be in snake_case.
    `;
    
    // Configure and call Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 15000,
      },
    });
    
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    
    // The response object structure changed in recent versions
    // Use the proper way to access the response text
    try {
      // Get the text from the response parts
      const responseText = result.response.text();
      console.log('Raw response:', responseText);
      
      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from Gemini API');
      }
      
      // Check if response starts with a JSON object
      const trimmedResponse = responseText.trim();
      if (!trimmedResponse.startsWith('{')) {
        // If it doesn't start with '{', try to extract JSON from markdown code blocks
        const jsonMatch = trimmedResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          // Found JSON in a code block
          const extractedJson = jsonMatch[1].trim();
          console.log('Extracted JSON from code block');
          return JSON.parse(extractedJson);
        } else {
          throw new Error('Response is not in JSON format');
        }
      }
      
      // Parse the response as JSON
      const analysisData = JSON.parse(trimmedResponse);
      console.log('Successfully parsed AI analysis');
      
      // Map the AI analysis results to our language skill IDs (85-102)
      const enhancedAnalysis = mapAiResultsToLanguageSkills(analysisData);
      
      return enhancedAnalysis;
    } catch (jsonError) {
      console.error('Error parsing Gemini response as JSON:', jsonError);
      
      // If we have the raw response in the error log (which looks valid)
      // Let's attempt to extract and use that
      const errorString = String(jsonError);
      const rawJsonMatch = errorString.match(/Raw response: ```json\s*([\s\S]*?)\s*```/);
      
      if (rawJsonMatch && rawJsonMatch[1]) {
        try {
          console.log('Attempting to parse from error log');
          const extractedJson = rawJsonMatch[1].trim();
          return JSON.parse(extractedJson);
        } catch (secondError) {
          console.error('Failed second attempt to parse JSON:', secondError);
        }
      }
      
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('Error analyzing speech with AI:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Maps AI analysis results to our language skills (85-102)
 * This helps ensure the AI analysis matches our skill structure
 */
function mapAiResultsToLanguageSkills(analysisData: any) {
  if (!analysisData || !analysisData.analysis) {
    return analysisData;
  }
  
  // Create a mapping between AI analysis keys and our language skills - updated with correct order
  const skillMapping: Record<string, number> = {
    'adapted_language': 85, // Adapted
    'flow': 95, // Flow
    'strong_rhetoric': 72, // Strong Rhetoric
    'filler_language': 79, // Filler Words
    'negations': 89, // Negations
    'repetitive_words': 87, // Repetitive Words
    'absolute_words': 91, // Absolute Words
    'filler_sounds': 103, // Filler Sounds (added)
    'strategic_language': 83, // Strategic
    'valued_language': 84, // Valued
    'hexacolon': 94, // Hexacolon
    'tricolon': 86, // Tricolon
    'repetition': 87, // Repetition
    'anaphora': 96, // Anaphora
    'epiphora': 88, // Epiphora
    'alliteration': 90, // Alliteration
    'correctio': 100, // Correctio
    'climax': 93, // Climax
    'anadiplosis': 92, // Anadiplosis
  };
  
  // Create a new analysis object with skill IDs for compatibility with our system
  const mappedAnalysis: { analysis: Record<string, any> } = { analysis: {} };
  
  // Map the API skills to our system
  Object.entries(analysisData.analysis).forEach(([key, value]: [string, any]) => {
    if (skillMapping[key]) {
      // Find the corresponding skill name from our languageSkills array
      const skill = languageSkills.find((s: any) => s.id === skillMapping[key]);
      if (skill) {
        // Adjust scores for negative skills
        if (!skill.isGoodSkill && value.score > 0) {
          value.score = -value.score; // Convert positive scores to negative for bad skills
        }
        
        // Add to mapped analysis
        mappedAnalysis.analysis[key] = {
          ...value,
          skill_id: skillMapping[key],
          skill_name: skill.name
        };
      }
    }
  });
  
  // Return both the mapped analysis and the original
  return {
    ...analysisData,
    mappedAnalysis
  };
}
