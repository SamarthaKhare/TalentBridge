interface SkillMatch {
  skillId: string;
  weight: number;
  required: boolean;
}

interface CandidateSkillInfo {
  skillId: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  years: number;
}

const PROFICIENCY_MULTIPLIER: Record<string, number> = {
  BEGINNER: 0.5,
  INTERMEDIATE: 0.75,
  EXPERT: 1.0,
};

export function calculateMatchScore(
  jobSkills: SkillMatch[],
  candidateSkills: CandidateSkillInfo[],
  candidateExperience: number | null,
  jobExperienceMin: number | null,
  jobExperienceMax: number | null,
  candidateLocation: string | null,
  jobLocation: string | null,
  candidateNoticePeriod: number | null,
  requiredNoticePeriod?: number | null
): number {
  let score = 0;

  // Skill match (60 points max)
  if (jobSkills.length > 0) {
    const candidateSkillMap = new Map(
      candidateSkills.map((s) => [s.skillId, s])
    );
    let earnedSkillScore = 0;
    let maxSkillScore = 0;

    for (const js of jobSkills) {
      maxSkillScore += js.weight * 1.0; // max proficiency multiplier
      const cs = candidateSkillMap.get(js.skillId);
      if (cs) {
        earnedSkillScore += js.weight * PROFICIENCY_MULTIPLIER[cs.proficiency];
      }
    }

    if (maxSkillScore > 0) {
      score += (earnedSkillScore / maxSkillScore) * 60;
    }
  }

  // Experience match (20 points)
  if (candidateExperience !== null && (jobExperienceMin !== null || jobExperienceMax !== null)) {
    const min = jobExperienceMin ?? 0;
    const max = jobExperienceMax ?? 100;
    if (candidateExperience >= min && candidateExperience <= max) {
      score += 20;
    } else if (
      candidateExperience >= min - 2 && candidateExperience <= max + 2
    ) {
      score += 10;
    }
  }

  // Location match (10 points)
  if (candidateLocation && jobLocation) {
    const cLoc = candidateLocation.toLowerCase().trim();
    const jLoc = jobLocation.toLowerCase().trim();
    if (cLoc === jLoc) {
      score += 10;
    } else {
      // Check if same country (simple: last word comparison)
      const cCountry = cLoc.split(',').pop()?.trim();
      const jCountry = jLoc.split(',').pop()?.trim();
      if (cCountry && jCountry && cCountry === jCountry) {
        score += 5;
      }
    }
  }

  // Notice period fit (10 points)
  if (candidateNoticePeriod !== null && requiredNoticePeriod != null) {
    if (candidateNoticePeriod <= requiredNoticePeriod!) {
      score += 10;
    }
  }

  return Math.round(Math.min(100, score));
}

export function getMatchExplanation(
  jobSkills: SkillMatch[],
  candidateSkills: CandidateSkillInfo[],
  skillNames: Map<string, string>
): { matchedSkills: string[]; missingSkills: string[] } {
  const candidateSkillIds = new Set(candidateSkills.map((s) => s.skillId));
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const js of jobSkills) {
    const name = skillNames.get(js.skillId) || js.skillId;
    if (candidateSkillIds.has(js.skillId)) {
      matchedSkills.push(name);
    } else {
      missingSkills.push(name);
    }
  }

  return { matchedSkills, missingSkills };
}
