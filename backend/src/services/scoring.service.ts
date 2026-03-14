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
  BEGINNER: 0.4,
  INTERMEDIATE: 0.7,
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
  const hasSkills = jobSkills.length > 0;
  const hasExperience = candidateExperience !== null && (jobExperienceMin !== null || jobExperienceMax !== null);
  const hasLocation = !!(candidateLocation && jobLocation);
  const hasNoticePeriod = candidateNoticePeriod !== null && requiredNoticePeriod != null;

  // Heavily favour skills and experience
  // Skills: 70pts, Experience: 20pts, Location: 5pts, Notice: 5pts
  let skillWeight = hasSkills ? 70 : 0;
  let expWeight = hasExperience ? 20 : 0;
  let locWeight = hasLocation ? 5 : 0;
  let noticeWeight = hasNoticePeriod ? 5 : 0;

  const totalActive = skillWeight + expWeight + locWeight + noticeWeight;
  if (totalActive === 0) return 0;

  // Normalize to 100
  const scale = 100 / totalActive;
  skillWeight *= scale;
  expWeight *= scale;
  locWeight *= scale;
  noticeWeight *= scale;

  let score = 0;

  // ── Skills (dominant factor) ──
  if (hasSkills) {
    const candidateSkillMap = new Map(
      candidateSkills.map((s) => [s.skillId, s])
    );
    let earnedSkillScore = 0;
    let maxSkillScore = 0;
    let missingRequired = 0;

    for (const js of jobSkills) {
      maxSkillScore += js.weight * 1.0;
      const cs = candidateSkillMap.get(js.skillId);
      if (cs) {
        // Proficiency multiplier + bonus for years of experience in that skill
        const yearsBonus = Math.min(cs.years / 10, 0.15); // up to 15% bonus
        const multiplier = Math.min(1.0, PROFICIENCY_MULTIPLIER[cs.proficiency] + yearsBonus);
        earnedSkillScore += js.weight * multiplier;
      } else if (js.required) {
        missingRequired++;
      }
    }

    if (maxSkillScore > 0) {
      let skillScore = (earnedSkillScore / maxSkillScore) * skillWeight;
      // Penalise heavily for each missing required skill (up to 40% penalty)
      const requiredCount = jobSkills.filter((s) => s.required).length;
      if (requiredCount > 0 && missingRequired > 0) {
        const penaltyRate = Math.min(0.4, (missingRequired / requiredCount) * 0.5);
        skillScore *= (1 - penaltyRate);
      }
      score += skillScore;
    }
  }

  // ── Experience (second most important) ──
  if (hasExperience) {
    const min = jobExperienceMin ?? 0;
    const max = jobExperienceMax ?? 100;
    const exp = candidateExperience!;

    if (exp >= min && exp <= max) {
      // Perfect fit — full points
      score += expWeight;
    } else if (exp > max) {
      // Overqualified — still good but slight reduction
      const overBy = exp - max;
      score += expWeight * Math.max(0.5, 1 - overBy * 0.05);
    } else if (exp >= min - 1) {
      // Slightly under — 70%
      score += expWeight * 0.7;
    } else if (exp >= min - 2) {
      // Under by 2 years — 40%
      score += expWeight * 0.4;
    }
    // else: too far off, 0 points
  }

  // ── Location (minor) ──
  if (hasLocation) {
    const cLoc = candidateLocation!.toLowerCase().trim();
    const jLoc = jobLocation!.toLowerCase().trim();
    if (cLoc === jLoc) {
      score += locWeight;
    } else {
      const cCountry = cLoc.split(',').pop()?.trim();
      const jCountry = jLoc.split(',').pop()?.trim();
      if (cCountry && jCountry && cCountry === jCountry) {
        score += locWeight * 0.5;
      }
    }
  }

  // ── Notice period (minor) ──
  if (hasNoticePeriod) {
    if (candidateNoticePeriod! <= requiredNoticePeriod!) {
      score += noticeWeight;
    } else {
      // Partially within — some credit if within 30 days over
      const overBy = candidateNoticePeriod! - requiredNoticePeriod!;
      if (overBy <= 30) {
        score += noticeWeight * 0.5;
      }
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
