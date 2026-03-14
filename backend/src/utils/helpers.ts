import { CandidateProfile, CandidateSkill } from '@prisma/client';

export function calculateProfileCompletion(
  profile: CandidateProfile & { candidateSkills?: CandidateSkill[] }
): number {
  let score = 0;
  const weights = {
    headline: 10,
    bio: 10,
    location: 10,
    experienceYears: 10,
    noticePeriodDays: 5,
    currentCtc: 5,
    expectedCtc: 5,
    graduationDate: 5,
    resumeUrl: 15,
    linkedinUrl: 5,
    githubUrl: 5,
    portfolioUrl: 5,
    skills: 10,
  };

  if (profile.headline) score += weights.headline;
  if (profile.bio) score += weights.bio;
  if (profile.location) score += weights.location;
  if (profile.experienceYears !== null) score += weights.experienceYears;
  if (profile.noticePeriodDays !== null) score += weights.noticePeriodDays;
  if (profile.currentCtc !== null) score += weights.currentCtc;
  if (profile.expectedCtc !== null) score += weights.expectedCtc;
  if (profile.graduationDate) score += weights.graduationDate;
  if (profile.resumeUrl) score += weights.resumeUrl;
  if (profile.linkedinUrl) score += weights.linkedinUrl;
  if (profile.githubUrl) score += weights.githubUrl;
  if (profile.portfolioUrl) score += weights.portfolioUrl;
  if (profile.candidateSkills && profile.candidateSkills.length > 0) score += weights.skills;

  return score;
}

export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 min
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}
