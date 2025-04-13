/**
 * Helper functions for speech analysis and formatting
 */

/**
 * Formats a skill name from snake_case to Title Case
 */
export function formatSkillName(skill: string): string {
  return skill.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a category name from snake_case to Title Case
 */
export function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

/**
 * Maps a skill to its category
 */
export function getSkillCategory(skill: string): string {
  const categories: {[key: string]: string} = {
    adapted_language: 'structural',
    flow: 'structural',
    strong_rhetoric: 'structural',
    strategic_language: 'structural',
    valued_language: 'structural',
    filler_language: 'filler',
    negations: 'filler',
    repetitive_words: 'filler',
    absolute_words: 'filler',
    hexacolon: 'rhetorical',
    tricolon: 'rhetorical',
    repetition: 'rhetorical',
    anaphora: 'rhetorical',
    epiphora: 'rhetorical',
    alliteration: 'rhetorical',
    correctio: 'rhetorical',
    climax: 'rhetorical',
    anadiplosis: 'rhetorical'
  };
  
  return categories[skill] || 'other';
}

/**
 * Groups skills by their categories
 */
export function groupSkillsByCategory(analysis: any) {
  const grouped: {[key: string]: any} = {};
  
  Object.entries(analysis).forEach(([skill, data]: [string, any]) => {
    const category = getSkillCategory(skill);
    
    if (!grouped[category]) {
      grouped[category] = {};
    }
    
    grouped[category][skill] = data;
  });
  
  return grouped;
}
