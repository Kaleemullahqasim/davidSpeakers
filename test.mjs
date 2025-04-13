import { YoutubeTranscript } from 'youtube-transcript';

const videoId = 'dQw4w9WgXcQ'; // Replace with your video ID or full URL

// lets only get the text 
// and not the start and end time

// Fetch the transcript for the video
YoutubeTranscript.fetchTranscript(videoId, { textOnly: true })
  .then(transcript => {

    // Process the transcript as needed
    // For example, you can join the text into a single string
    const fullTranscript = transcript.map(item => item.text).join(' ');
    console.log(fullTranscript);
    // Save the transcript to a fil
  })
  .catch(error => {
    console.error('Error fetching transcript:', error.message);
  });



