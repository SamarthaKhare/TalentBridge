import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { getJobRecommendations } from '../../services/recommendation.service';

export const getHrDashboard = async (req: Request, res: Response) => {
  try {
    const hrId = req.user!.userId;

    const jobs = await prisma.job.findMany({
      where: { hrId },
      include: {
        _count: {
          select: { applications: true, jobViews: true },
        },
        applications: {
          select: { status: true, matchScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate stats
    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((sum, j) => sum + j._count.applications, 0);
    const allApps = jobs.flatMap((j) => j.applications);
    const avgMatchScore = allApps.length > 0
      ? Math.round(allApps.reduce((sum, a) => sum + a.matchScore, 0) / allApps.length)
      : 0;
    const interviews = allApps.filter((a) => a.status === 'INTERVIEW').length;
    const offers = allApps.filter((a) => a.status === 'OFFER').length;

    // Pipeline breakdown per job
    const pipeline = jobs.map((job) => {
      const statusCounts: Record<string, number> = {
        APPLIED: 0,
        SHORTLISTED: 0,
        INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
      };
      job.applications.forEach((a) => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });

      return {
        id: job.id,
        title: job.title,
        status: job.status,
        totalApplicants: job._count.applications,
        views: job._count.jobViews,
        deadline: job.deadline,
        createdAt: job.createdAt,
        pipeline: statusCounts,
      };
    });

    // Outreach count per job (via recipients)
    const outreachCount = await prisma.outreachEmail.count({
      where: { hrId },
    });

    // Top skills in demand
    const skillDemand = await prisma.jobSkill.groupBy({
      by: ['skillId'],
      where: { job: { hrId } },
      _count: { skillId: true },
      orderBy: { _count: { skillId: 'desc' } },
      take: 10,
    });

    const demandSkillIds = skillDemand.map((s) => s.skillId);
    const demandSkills = await prisma.skill.findMany({
      where: { id: { in: demandSkillIds } },
    });

    const topSkillsInDemand = skillDemand.map((s) => ({
      skill: demandSkills.find((sk) => sk.id === s.skillId)?.name || '',
      count: s._count.skillId,
    }));

    return res.json({
      overview: { totalJobs, totalApplications, avgMatchScore, interviews, offers, outreachCount },
      pipeline,
      topSkillsInDemand,
    });
  } catch (error) {
    console.error('HR dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCandidateDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { candidateSkills: { include: { skill: true } } },
    });

    const applications = await prisma.application.findMany({
      where: { candidateId: userId },
      include: {
        job: {
          select: { title: true, status: true, hr: { select: { hrProfile: true } } },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: 5,
    });

    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: { candidateId: userId },
      _count: { status: true },
    });

    const recommendations = await getJobRecommendations(userId);

    const savedCount = await prisma.savedJob.count({
      where: { candidateId: userId },
    });

    return res.json({
      profile: {
        completionScore: profile?.profileCompletionScore || 0,
        skillCount: profile?.candidateSkills.length || 0,
      },
      recentApplications: applications,
      applicationStats: statusCounts.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count.status }),
        {} as Record<string, number>
      ),
      recommendations: recommendations.slice(0, 5),
      savedJobsCount: savedCount,
    });
  } catch (error) {
    console.error('Candidate dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
