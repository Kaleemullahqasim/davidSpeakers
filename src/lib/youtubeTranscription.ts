import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Decodes HTML entities in a string - Node.js compatible version
 * @param text The text with HTML entities to decode
 * @returns The decoded text
 */
function decodeHtmlEntities(text: string): string {
  // Basic Node.js compatible HTML entity decoding
  // For more robust decoding, consider a library like 'he'
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'"); // &apos; is also common
}

export async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  console.log(`[youtubeTranscription] Attempting to fetch transcript for videoId: ${videoId}`);
  try {
    const transcriptSegments = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptSegments || transcriptSegments.length === 0) {
      console.warn(`[youtubeTranscription] No transcript segments found for videoId: ${videoId}`);
      return null;
    }

    const fullTranscript = transcriptSegments.map(segment => segment.text).join(' ');
    console.log(`[youtubeTranscription] Successfully fetched and combined transcript for videoId: ${videoId}. Length: ${fullTranscript.length}`);
    // Ensure decoding happens correctly
    return decodeHtmlEntities(fullTranscript);
  } catch (error: any) {
    console.error(`[youtubeTranscription] Error fetching transcript for videoId: ${videoId}. Error:`, error);
    // Log more details from the error object if available
    if (error.message) {
      console.error(`[youtubeTranscription] Error message: ${error.message}`);
    }
    if (error.stack) {
      console.error(`[youtubeTranscription] Error stack: ${error.stack}`);
    }
    // You might want to re-throw or handle this error in a way that the calling function knows it failed
    throw new Error(`Failed to get YouTube transcript for videoId ${videoId}: ${error.message || 'Unknown error'}`);
  }
}

export async function getYouTubeVideoDetails(videoId: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet,contentDetails`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const videoDetails = data.items[0];
      return {
        title: videoDetails.snippet.title,
        description: videoDetails.snippet.description,
        thumbnailUrl: videoDetails.snippet.thumbnails.high.url,
        channelTitle: videoDetails.snippet.channelTitle,
        publishedAt: videoDetails.snippet.publishedAt,
        duration: videoDetails.contentDetails.duration
      };
    }
    
    throw new Error('Video not found');
  } catch (error) {
    console.error('Error fetching YouTube video details:', error);
    throw error;
  }
}

/**
 * Get transcript from a YouTube video
 * @param videoId The YouTube video ID
 * @returns A promise that resolves to the transcript text
 */
export async function transcribeYouTubeVideo(videoId: string): Promise<string> {
  console.log(`[youtubeTranscription] Starting transcribeYouTubeVideo for videoId: ${videoId}`);
  try {
    const transcript = await getYouTubeTranscript(videoId);
    if (transcript === null) {
      console.error(`[youtubeTranscription] Transcription returned null for videoId: ${videoId}`);
      throw new Error('Transcription resulted in null, possibly no captions or an error.');
    }
    console.log(`[youtubeTranscription] Transcription successful for videoId: ${videoId}`);
    return transcript;
  } catch (error: any) {
    console.error(`[youtubeTranscription] Error in transcribeYouTubeVideo for videoId: ${videoId}. Error:`, error.message);
    // Re-throw to be caught by the API route
    throw error;
  }
}

/**
 * Check if a YouTube video has captions available
 * @param videoId The YouTube video ID
 * @returns A promise that resolves to a boolean
 */
export async function hasCaptions(videoId: string): Promise<boolean> {
  try {
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId);
    return Array.isArray(transcriptResponse) && transcriptResponse.length > 0;
  } catch (error) {
    console.error('Error checking for captions:', error);
    return false;
  }
}
