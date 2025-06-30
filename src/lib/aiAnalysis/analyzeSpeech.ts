import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAnalysisPrompt } from './promptUtils';
import { mapAiResultsToLanguageSkills } from './mappingUtils';
import { parseAiResponse } from './responseUtils';

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
    console.log('🔍 Starting Google Gemini AI analysis of speech transcript...');
    console.log(`📋 Transcript length: ${transcript.length} characters`);
    console.log(`👥 Audience information: ${audience || 'None provided'}`);
    
    // Check if Gemini API key is available
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY is not configured');
      throw new Error('Google Gemini API key is not configured');
    }
    
    // Log the first few characters of the API key (for debugging, never do this in production!)
    const apiKeyFirstChars = process.env.GOOGLE_GEMINI_API_KEY.substring(0, 4);
    const apiKeyLength = process.env.GOOGLE_GEMINI_API_KEY.length;
    console.log(`✅ Google Gemini API key available (starts with: ${apiKeyFirstChars}..., length: ${apiKeyLength})`);
    
    // Check for transcript content
    if (!transcript || transcript.trim().length < 10) {
      throw new Error('Transcript is too short or empty');
    }
    
    // Create the prompt
    console.log('📝 Creating analysis prompt for Gemini API...');
    const prompt = createAnalysisPrompt(transcript, audience);
    console.log(`📏 Prompt created (${prompt.length} characters)`);
    console.log('📄 First 100 characters of prompt:', prompt.substring(0, 100) + '...');
    
    // Configure and call Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",  // Make sure this matches Google's current model name
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 15000,
      },
    });
    
    console.log('🔄 Initializing request to Google Gemini API...');
    console.log('📡 SENDING REQUEST TO GOOGLE GEMINI API');
    
    // Add a timeout to handle stuck requests
    let responseReceived = false;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('Google Gemini API request timed out after 60 seconds'));
        }
      }, 60000); // 60 second timeout
    });
    
    const generatePromise = model.generateContent(prompt);
    
    const startTime = Date.now();
    const result = await Promise.race([generatePromise, timeoutPromise]);
    responseReceived = true;
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Gemini API response received in ${duration}ms`);
    
    // Parse the response
    console.log('🔄 Parsing response from Gemini API...');
    const analysisData = await parseAiResponse(result);
    
    if (!analysisData || !analysisData.analysis) {
      console.error('❌ Failed to get valid analysis data from Gemini API');
      throw new Error('Invalid response format from Gemini API');
    }
    
    // Print the skills that were analyzed
    const skillsAnalyzed = Object.keys(analysisData.analysis);
    console.log(`✅ Successfully analyzed ${skillsAnalyzed.length} skills:`);
    console.log(skillsAnalyzed.join(', '));
    
    // Map the AI analysis results to our language skill IDs (85-102)
    console.log('🔄 Mapping analysis results to language skills...');
    const enhancedAnalysis = mapAiResultsToLanguageSkills(analysisData);
    
    return enhancedAnalysis;
  } catch (error) {
    console.error('❌ Error analyzing speech with Google Gemini AI:', error);
    // Add as much detail as possible about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Google Gemini AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
