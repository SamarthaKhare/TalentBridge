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

export function calculateMatchScore(
  jobSkills: SkillMatch[],
  candidateSkills: CandidateSkillInfo[],
  candidateExperience: number | null,
  jobExperienceMin: number | null,
  jobExperienceMax: number | null,
  _candidateLocation: string | null,
  _jobLocation: string | null,
  _candidateNoticePeriod: number | null,
  _requiredNoticePeriod?: number | null
): number {
  let score = 0;
  const candidateSkillIds = new Set(candidateSkills.map((s) => s.skillId));

  // ── Skills: 70 pts ──
  // Score = (number of required job skills the candidate has / total required job skills) * 70
  // If no skills are marked required, use all job skills instead
  if (jobSkills.length > 0) {
    const requiredSkills = jobSkills.filter((s) => s.required);
    const poolToMatch = requiredSkills.length > 0 ? requiredSkills : jobSkills;

    let matched = 0;
    for (const js of poolToMatch) {
      if (candidateSkillIds.has(js.skillId)) {
        matched++;
      }
    }

    score += (matched / poolToMatch.length) * 70;
  }

  // ── Experience: 30 pts ──
  // Full 30 if within range, gradual reduction outside
  if (candidateExperience !== null && (jobExperienceMin !== null || jobExperienceMax !== null)) {
    const min = jobExperienceMin ?? 0;
    const max = jobExperienceMax ?? 100;

    if (candidateExperience >= min && candidateExperience <= max) {
      score += 30;
    } else if (candidateExperience > max) {
      // Overqualified — still valuable, slight reduction
      const overBy = candidateExperience - max;
      score += Math.max(15, 30 - overBy * 3);
    } else {
      // Under-experienced — proportional credit
      const ratio = min > 0 ? candidateExperience / min : 0;
      score += Math.min(30, ratio * 30);
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
