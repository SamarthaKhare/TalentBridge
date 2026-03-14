import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { calculateMatchScore } from '../../services/scoring.service';

export const searchJobs = async (req: Request, res: Response) => {
  try {
    const {
      q,
      skills,
      location,
      jobType,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      datePosted,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'OPEN' };

    // Full-text search on title + description
    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (experienceMin || experienceMax) {
      where.experienceMin = experienceMin ? { gte: parseInt(experienceMin as string) } : undefined;
      where.experienceMax = experienceMax ? { lte: parseInt(experienceMax as string) } : undefined;
    }

    if (salaryMin) where.salaryMin = { gte: parseFloat(salaryMin as string) };
    if (salaryMax) where.salaryMax = { lte: parseFloat(salaryMax as string) };

    if (datePosted) {
      const now = new Date();
      let since: Date;
      switch (datePosted) {
        case '24h':
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(0);
      }
      where.createdAt = { gte: since };
    }

    // Skill filter
    if (skills) {
      const skillIds = (skills as string).split(',');
      where.jobSkills = { some: { skillId: { in: skillIds } } };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          jobSkills: { include: { skill: true } },
          hr: { select: { name: true, hrProfile: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return res.json({
      jobs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Search jobs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchCandidates = async (req: Request, res: Response) => {
  try {
    const {
      q,
      skills,
      location,
      experienceMin,
      experienceMax,
      noticePeriodMax,
      expectedCtcMin,
      expectedCtcMax,
      minCompleteness,
      sortBy = 'score',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (experienceMin) where.experienceYears = { ...where.experienceYears, gte: parseInt(experienceMin as string) };
    if (experienceMax) where.experienceYears = { ...where.experienceYears, lte: parseInt(experienceMax as string) };
    if (noticePeriodMax) where.noticePeriodDays = { lte: parseInt(noticePeriodMax as string) };
    if (expectedCtcMin) where.expectedCtc = { ...where.expectedCtc, gte: parseFloat(expectedCtcMin as string) };
    if (expectedCtcMax) where.expectedCtc = { ...where.expectedCtc, lte: parseFloat(expectedCtcMax as string) };
    if (minCompleteness) where.profileCompletionScore = { gte: parseInt(minCompleteness as string) };

    if (skills) {
      const skillIds = (skills as string).split(',');
      where.candidateSkills = { some: { skillId: { in: skillIds } } };
    }

    if (q) {
      where.OR = [
        { headline: { contains: q as string, mode: 'insensitive' } },
        { bio: { contains: q as string, mode: 'insensitive' } },
        { user: { name: { contains: q as string, mode: 'insensitive' } } },
      ];
    }

    const candidates = await prisma.candidateProfile.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        candidateSkills: { include: { skill: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const total = await prisma.candidateProfile.count({ where });

    // Calculate scores if skills filter is provided
    let results = candidates.map((c) => {
      let score = 0;
      if (skills) {
        const skillIds = (skills as string).split(',');
        const jobSkillsForScoring = skillIds.map((id) => ({
          skillId: id,
          weight: 5,
          required: false,
        }));

        score = calculateMatchScore(
          jobSkillsForScoring,
          c.candidateSkills.map((cs) => ({
            skillId: cs.skillId,
            proficiency: cs.proficiency,
            years: cs.years,
          })),
          c.experienceYears,
          experienceMin ? parseInt(experienceMin as string) : null,
          experienceMax ? parseInt(experienceMax as string) : null,
          c.location,
          location as string || null,
          c.noticePeriodDays,
          noticePeriodMax ? parseInt(noticePeriodMax as string) : null
        );
      }

      return { ...c, matchScore: score };
    });

    // Sort
    if (sortBy === 'score') results.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'experience') results.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
    else if (sortBy === 'name') results.sort((a, b) => a.user.name.localeCompare(b.user.name));

    return res.json({
      candidates: results,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Search candidates error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const suggestSkills = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 1) {
      return res.json([]);
    }

    // Search by name and aliases using case-insensitive contains
    const skills = await prisma.skill.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { aliases: { has: q.toLowerCase() } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    // Also expand by category — if a skill matches, suggest others in same category
    const categories = [...new Set(skills.map((s) => s.category).filter(Boolean))];
    let expanded: typeof skills = [];
    if (categories.length > 0) {
      expanded = await prisma.skill.findMany({
        where: {
          category: { in: categories as string[] },
          id: { notIn: skills.map((s) => s.id) },
        },
        take: 10,
      });
    }

    return res.json({
      matches: skills,
      related: expanded,
    });
  } catch (error) {
    console.error('Suggest skills error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
