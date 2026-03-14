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
  // Determine which scoring dimensions are active
  const hasSkills = jobSkills.length > 0;
  const hasExperience = candidateExperience !== null && (jobExperienceMin !== null || jobExperienceMax !== null);
  const hasLocation = !!(candidateLocation && jobLocation);
  const hasNoticePeriod = candidateNoticePeriod !== null && requiredNoticePeriod != null;

  // PRD weights: skills=60, experience=20, location=10, notice=10
  // If a dimension is not applicable, redistribute its points proportionally
  let skillWeight = hasSkills ? 60 : 0;
  let expWeight = hasExperience ? 20 : 0;
  let locWeight = hasLocation ? 10 : 0;
  let noticeWeight = hasNoticePeriod ? 10 : 0;

  const totalActive = skillWeight + expWeight + locWeight + noticeWeight;

  // If nothing to score on, return 0
  if (totalActive === 0) return 0;

  // Normalize weights to sum to 100
  const scale = 100 / totalActive;
  skillWeight *= scale;
  expWeight *= scale;
  locWeight *= scale;
  noticeWeight *= scale;

  let score = 0;

  // Skill match
  if (hasSkills) {
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
      score += (earnedSkillScore / maxSkillScore) * skillWeight;
    }
  }

  // Experience match
  if (hasExperience) {
    const min = jobExperienceMin ?? 0;
    const max = jobExperienceMax ?? 100;
    if (candidateExperience! >= min && candidateExperience! <= max) {
      score += expWeight;
    } else if (candidateExperience! >= min - 2 && candidateExperience! <= max + 2) {
      score += expWeight * 0.5;
    }
  }

  // Location match
  if (hasLocation) {
    const cLoc = candidateLocation!.toLowerCase().trim();
    const jLoc = jobLocation!.toLowerCase().trim();
    if (cLoc === jLoc) {
      score += locWeight;
    } else {
      // Check if same country (last segment after comma)
      const cCountry = cLoc.split(',').pop()?.trim();
      const jCountry = jLoc.split(',').pop()?.trim();
      if (cCountry && jCountry && cCountry === jCountry) {
        score += locWeight * 0.5;
      }
    }
  }

  // Notice period fit
  if (hasNoticePeriod) {
    if (candidateNoticePeriod! <= requiredNoticePeriod!) {
      score += noticeWeight;
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)));
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
