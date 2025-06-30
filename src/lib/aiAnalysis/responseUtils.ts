/**
 * Parses the response from the AI model and extracts the analysis data
 */
export async function parseAiResponse(result: any) {
  try {
    // Get the text from the response parts
    const responseText = result.response.text();
    console.log('Raw response length:', responseText.length);
    
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
    
    return analysisData;
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
}
