import { isGoodSkill, getDefaultMaxScore, getDefaultWeight } from './scoreCalculator';

export interface SkillDefinition {
  id: number;
  name: string;
  isGoodSkill: boolean;
  maxScore: number;
  weight: number;
}

// Nervousness Skills (1-6)
export const nervousnessSkills: SkillDefinition[] = [
  { id: 1, name: "Swaying", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 2, name: "Squirming", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 3, name: "Irrational movement", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 4, name: "Stroke / Fidget", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 5, name: "Flight / Freeze", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 6, name: "Unbalanced feet", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) }
];

// Voice Skills (7-24)
export const voiceSkills: SkillDefinition[] = [
  { id: 7, name: "Register / Pitch", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 8, name: "Slow pace", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 9, name: "Fast pace", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 10, name: "Base pace", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 11, name: "Timbre", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 12, name: "Emphasis", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 13, name: "Playful emphasis", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 14, name: "Base volume", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 15, name: "Varied volume", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 16, name: "Up-Down talk", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 17, name: "Volume increase", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 18, name: "Volume decrease", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 19, name: "Unfunctional pauses", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 20, name: "Relaxation pause", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 21, name: "Strategic pause", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 22, name: "Effect pause", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 23, name: "Vocal Fry", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 24, name: "Elongated vowels", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 26, name: "Prosody", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 27, name: "Melody", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 28, name: "Articulation", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 29, name: "Voice climax", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 30, name: "Dramatising", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 31, name: "Language change", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 32, name: "Sound effects", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) }
];

// Body Language Skills (33-75)
export const bodyLanguageSkills: SkillDefinition[] = [
  { id: 33, name: "Confident posture", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 34, name: "Neutral Posture", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 35, name: "Amplifying Posture", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 36, name: "Ticks", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 37, name: "Feet", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 38, name: "Hips", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 39, name: "Angle", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 40, name: "Relaxed", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 41, name: "Dramatising", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 42, name: "Shrugging shoulders", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 43, name: "Intensity variation", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 44, name: "Functional", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 45, name: "Smooth", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 46, name: "Distinct", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 47, name: "Adapted size", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 48, name: "Standard pace", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 49, name: "Adapted pace", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 50, name: "Full out", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 51, name: "Pointing", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 52, name: "Volume/Size", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 53, name: "Regulators", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 54, name: "Rhythm of speech", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 55, name: "Signs", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 56, name: "Imaginary props", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 57, name: "Drawings", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 58, name: "Affect display", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 59, name: "Sounds", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 60, name: "Progression", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 61, name: "Empowering head angle", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 62, name: "Unfunctional head angle", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 63, name: "Standard head angle", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 64, name: "Amplifying head movement", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 65, name: "Stage Presence", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 66, name: "Anchoring", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 67, name: "Vertical movement", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 68, name: "Power areas", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 69, name: "Horizontal movement", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 70, name: "Bent knees", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 71, name: "Amplification", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 72, name: "General eye contact", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 73, name: "Sweeping", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 74, name: "Focus", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 75, name: "Attire", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) }
];

// Expressions Skills (76-84)
export const expressionsSkills: SkillDefinition[] = [
  { id: 76, name: "Neutral", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 77, name: "Matching", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 78, name: "Dramatising", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 79, name: "Mouth", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 80, name: "Eyebrows", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 81, name: "Forehead", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 82, name: "Eyes", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 83, name: "Self laugh", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 84, name: "Straight face", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) }
];

// Language Skills (85-102)
export const languageSkills: SkillDefinition[] = [
  { id: 85, name: "Adapted", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 86, name: "Flow", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 87, name: "Strong rhetorics", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 88, name: "Filler words", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 89, name: "Negations", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 90, name: "Repetitive words", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 91, name: "Absolute words", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) },
  { id: 92, name: "Strategic", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 93, name: "Valued", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 94, name: "Hexacolon", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 95, name: "Tricolon", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 96, name: "Repetition", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 97, name: "Anaphora", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 98, name: "Epiphora", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 99, name: "Alliteration", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 100, name: "Correctio", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 101, name: "Climax", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 102, name: "Anadiplosis", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 25, name: "Filler sounds", isGoodSkill: false, maxScore: getDefaultMaxScore(false), weight: getDefaultWeight(false) }
];

// Ultimate Level Skills (103-110)
export const ultimateLevelSkills: SkillDefinition[] = [
  { id: 103, name: "Loves presenting", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 104, name: "Role playing", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 105, name: "Total intensity transition", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 106, name: "Acts out the obvious", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 107, name: "Present and authentic", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 108, name: "Synchronisity", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 109, name: "Contrast", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) },
  { id: 110, name: "Visualisation", isGoodSkill: true, maxScore: getDefaultMaxScore(true), weight: getDefaultWeight(true) }
];

// Get all skills in a single array
export function getAllSkills(): SkillDefinition[] {
  return [
    ...nervousnessSkills,
    ...voiceSkills,
    ...bodyLanguageSkills,
    ...expressionsSkills,
    ...languageSkills,
    ...ultimateLevelSkills
  ];
}

// Get parent class name for a skill ID
export function getParentClassForSkill(skillId: number): string {
  if (skillId >= 1 && skillId <= 6) return "Nervousness";
  if (skillId >= 7 && skillId <= 32) return "Voice";
  if (skillId >= 33 && skillId <= 75) return "Body Language";
  if (skillId >= 76 && skillId <= 84) return "Expressions";
  if (skillId >= 85 && skillId <= 102) return "Language";
  if (skillId >= 103 && skillId <= 110) return "Ultimate Level";
  return "Unknown";
}

// Get skill by ID - useful for retrieving skill details from just the ID
export function getSkillById(skillId: number | string): SkillDefinition | null {
  // Convert string ID to number if needed
  const id = typeof skillId === 'string' ? parseInt(skillId, 10) : skillId;
  
  // Return null for invalid IDs
  if (isNaN(id)) return null;
  
  // Find the skill in the appropriate skills array
  if (id >= 1 && id <= 6) {
    return nervousnessSkills.find((skill: any) => skill.id === id) || null;
  }
  if (id >= 7 && id <= 32) {
    return voiceSkills.find((skill: any) => skill.id === id) || null;
  }
  if (id >= 33 && id <= 75) {
    return bodyLanguageSkills.find((skill: any) => skill.id === id) || null;
  }
  if (id >= 76 && id <= 84) {
    return expressionsSkills.find((skill: any) => skill.id === id) || null;
  }
  if (id >= 85 && id <= 102) {
    return languageSkills.find((skill: any) => skill.id === id) || null;
  }
  if (id >= 103 && id <= 110) {
    return ultimateLevelSkills.find((skill: any) => skill.id === id) || null;
  }
  
  // Try searching through all skills as a fallback
  return getAllSkills().find((skill: any) => skill.id === id) || null;
}
