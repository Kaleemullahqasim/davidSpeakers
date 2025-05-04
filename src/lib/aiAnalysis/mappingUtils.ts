import { languageSkills } from '@/lib/skillsData';

/**
 * Maps AI analysis results to our language skills (85-102)
 * This helps ensure the AI analysis matches our skill structure
 */
export function mapAiResultsToLanguageSkills(analysisData: any) {
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
