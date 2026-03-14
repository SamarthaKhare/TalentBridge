import prisma from '../config/prisma';
import redis from '../config/redis';
import { calculateMatchScore } from './scoring.service';

const CACHE_TTL = 3600; // 1 hour

export async function getJobRecommendations(userId: string): Promise<any[]> {
  const cacheKey = `recommendations:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { candidateSkills: true },
  });

  if (!profile) return [];

  const openJobs = await prisma.job.findMany({
    where: { status: 'OPEN' },
    include: {
      jobSkills: { include: { skill: true } },
      hr: { include: { hrProfile: true } },
    },
  });

  const recommendations = openJobs.map((job) => {
    const score = calculateMatchScore(
      job.jobSkills.map((js) => ({
        skillId: js.skillId,
        weight: js.weight,
        required: js.required,
      })),
      profile.candidateSkills.map((cs) => ({
        skillId: cs.skillId,
        proficiency: cs.proficiency,
        years: cs.years,
      })),
      profile.experienceYears,
      job.experienceMin,
      job.experienceMax,
      profile.location,
      job.location,
      profile.noticePeriodDays,
      null
    );

    return {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        jobType: job.jobType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        deadline: job.deadline,
        createdAt: job.createdAt,
        company: job.hr.hrProfile?.companyName || 'Unknown',
        skills: job.jobSkills.map((js) => ({
          name: js.skill.name,
          required: js.required,
        })),
      },
      matchScore: score,
    };
  });

  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  const top = recommendations.slice(0, 20);

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(top));
  return top;
}

export async function invalidateRecommendations(userId: string): Promise<void> {
  await redis.del(`recommendations:${userId}`);
}
