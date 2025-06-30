/**
 * Creates a detailed analysis prompt for Google's Gemini AI
 */
export function createAnalysisPrompt(transcript: string, audience?: string): string {
  return `
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
    5. Valued Language – Using words that evoke positive emotions or credibility for intended audience of mentioned above in audience field.
    
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
}
