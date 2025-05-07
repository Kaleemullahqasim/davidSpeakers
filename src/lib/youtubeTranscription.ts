import { YoutubeTranscript } from 'youtube-transcript';
import { decode } from 'html-entities'; // Add this package via npm install html-entities

/**
 * Decodes HTML entities in a string (Node.js compatible)
 * @param text The text with HTML entities to decode
 * @returns The decoded text
 */
function decodeHtmlEntities(text: string): string {
  // Use html-entities package which works in both browser and Node.js
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
    console.log(`Starting transcription for video ID: ${videoId}`);
    
    // Fetch transcript using the correct method according to documentation
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptResponse || transcriptResponse.length === 0) {
      throw new Error('No transcript found for this video');
    }
    
    console.log(`Received transcript with ${transcriptResponse.length} segments`);
    
    // Combine all transcript segments into a single string
    let fullTranscript = transcriptResponse
      .map((segment: any) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim();
    
    // Clean up HTML entities like &amp;#39; (which should be apostrophes)
    // First, replace known patterns
    fullTranscript = fullTranscript
      .replace(/&amp;#39;/g, "'")       // Replace &amp;#39; with apostrophe
      .replace(/&#39;/g, "'")           // Replace &#39; with apostrophe
      .replace(/&quot;/g, '"')          // Replace &quot; with double quote
      .replace(/&amp;/g, '&')           // Replace &amp; with &
      .replace(/&lt;/g, '<')            // Replace &lt; with <
      .replace(/&gt;/g, '>')            // Replace &gt; with >
      .replace(/\s+/g, ' ')             // Clean up any extra spaces created in replacements
      .trim();
    
    // If we're in a browser environment, use the DOM to decode any remaining entities
    if (typeof window !== 'undefined') {
      fullTranscript = decodeHtmlEntities(fullTranscript);
    }
    
    return fullTranscript;
  } catch (error) {
    console.error('Error getting YouTube transcript:', error);
    throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
