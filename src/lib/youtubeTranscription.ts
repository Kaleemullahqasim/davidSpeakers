import { YoutubeTranscript } from 'youtube-transcript';
import { decode } from 'html-entities';
import axios from 'axios';

// Add interfaces for Supadata API responses
interface SupadataTranscriptSegment {
  lang: string;
  text: string;
  offset: number;
  duration: number;
}

interface SupadataTranscriptResponse {
  lang: string;
  availableLangs: string[];
  content: SupadataTranscriptSegment[];
}

/**
 * Gets a transcript from YouTube using the Supadata API
 * @param videoId The YouTube video ID
 * @returns A promise that resolves to the transcript text
 */
export async function getSupadataTranscript(videoId: string): Promise<string> {
  try {
    console.log(`[Supadata] Starting transcription for video ID: ${videoId}`);
    
    // Make request to Supadata API
    const response = await axios.get<SupadataTranscriptResponse>(
      `https://api.supadata.ai/v1/youtube/transcript`,
      {
        params: { videoId },
        headers: { 'x-api-key': process.env.SUPADATA_API_KEY },
        timeout: 8000 // Stay under Vercel's limit
      }
    );
    
    // Check if we got a valid response
    if (!response.data || !response.data.content || response.data.content.length === 0) {
      throw new Error('No transcript content returned from Supadata API');
    }
    
    console.log(`[Supadata] Received transcript with ${response.data.content.length} segments`);
    console.log(`[Supadata] Available languages: ${response.data.availableLangs.join(', ')}`);
    
    // Prefer English transcript if available, otherwise use whatever language is returned
    const preferredLang = response.data.availableLangs.includes('en') ? 'en' : response.data.lang;
    console.log(`[Supadata] Using language: ${preferredLang}`);
    
    // Extract and combine text from all segments
    let fullTranscript = '';
    
    // If we need to switch to English (or another language), make another request
    if (preferredLang !== response.data.lang) {
      console.log(`[Supadata] Fetching transcript in ${preferredLang} language`);
      const langResponse = await axios.get<SupadataTranscriptResponse>(
        `https://api.supadata.ai/v1/youtube/transcript`,
        {
          params: { 
            videoId,
            lang: preferredLang
          },
          headers: { 'x-api-key': process.env.SUPADATA_API_KEY },
          timeout: 8000
        }
      );
      
      if (!langResponse.data || !langResponse.data.content) {
        throw new Error(`Failed to get transcript in ${preferredLang}`);
      }
      
      // Join all text segments
      fullTranscript = langResponse.data.content
        .map(segment => segment.text.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      // Use original response
      fullTranscript = response.data.content
        .map(segment => segment.text.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    console.log(`[Supadata] Successfully transcribed video, length: ${fullTranscript.length} chars`);
    return fullTranscript;
  } catch (error) {
    console.error('[Supadata] Error getting transcript:', error);
    throw new Error(`Supadata API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decodes HTML entities in a string (Node.js compatible)
 * @param text The text with HTML entities to decode
 * @returns The decoded text
 */
function decodeHtmlEntities(text: string): string {
  return decode(text);
}

export async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Get transcript segments from the YouTube API
    const transcriptSegments = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptSegments || transcriptSegments.length === 0) {
      throw new Error('No transcript found for this video');
    }
    
    // Combine all segments into a single text
    const fullTranscript = transcriptSegments
      .map((segment: any) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    return fullTranscript;
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    return null;
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
  try {
    console.log(`Starting transcription for video ID: ${videoId} using Supadata API`);
    
    // Use our new Supadata method instead of the previous implementation
    const transcript = await getSupadataTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('Empty transcript returned');
    }
    
    // Clean up any remaining HTML entities
    const cleanedTranscript = decodeHtmlEntities(transcript);
    
    console.log(`Successfully transcribed video: ${cleanedTranscript.substring(0, 50)}...`);
    return cleanedTranscript;
  } catch (error) {
    console.error('Error transcribing video:', error);
    
    // Try the original method as fallback (optional)
    // If you want to remove the fallback, just throw the error here
    try {
      console.log('Attempting fallback transcription method...');
      const transcriptSegments = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcriptSegments || transcriptSegments.length === 0) {
        throw new Error('No transcript found for this video');
      }
      
      const fallbackTranscript = transcriptSegments
        .map((segment: any) => segment.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return decodeHtmlEntities(fallbackTranscript);
    } catch (fallbackError) {
      console.error('Fallback transcription also failed:', fallbackError);
      throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
