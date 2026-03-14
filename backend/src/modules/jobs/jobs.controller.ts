import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { jobCreateSchema, jobUpdateSchema } from '../../utils/validators';

export const getJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    else where.status = 'OPEN';

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          jobSkills: { include: { skill: true } },
          hr: {
            include: { hrProfile: true },
            select: { id: true, name: true, hrProfile: true } as any,
          },
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        jobSkills: { include: { skill: true } },
        hr: {
          select: { id: true, name: true, hrProfile: true },
        },
        questionnaire: {
          include: {
            questions: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Track view if authenticated candidate
    if (req.user?.role === 'CANDIDATE') {
      await prisma.jobView.create({
        data: { jobId: job.id, candidateId: req.user.userId },
      }).catch(() => {}); // Ignore if duplicate
    }

    return res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createJob = async (req: Request, res: Response) => {
  try {
    const data = jobCreateSchema.parse(req.body);
    const { skills, questionnaire, ...jobData } = data;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        hrId: req.user!.userId,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    // Create job skills
    if (skills && skills.length > 0) {
      await prisma.jobSkill.createMany({
        data: skills.map((s) => ({
          jobId: job.id,
          skillId: s.skillId,
          required: s.required,
          weight: s.weight,
        })),
      });
    }

    // Create questionnaire
    if (questionnaire && questionnaire.questions.length > 0) {
      const q = await prisma.jobQuestionnaire.create({
        data: { jobId: job.id },
      });

      await prisma.questionnaireQuestion.createMany({
        data: questionnaire.questions.map((qq, index) => ({
          questionnaireId: q.id,
          questionText: qq.questionText,
          questionType: qq.questionType,
          options: qq.options,
          isRequired: qq.isRequired,
          order: qq.order || index,
        })),
      });
    }

    const fullJob = await prisma.job.findUnique({
      where: { id: job.id },
      include: {
        jobSkills: { include: { skill: true } },
        questionnaire: { include: { questions: true } },
      },
    });

    return res.status(201).json(fullJob);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const data = jobUpdateSchema.parse(req.body);

    const existing = await prisma.job.findFirst({
      where: { id: req.params.id, hrId: req.user!.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { skills, questionnaire, ...jobData } = data;

    const updateData: any = { ...jobData };
    if (data.deadline) updateData.deadline = new Date(data.deadline);

    await prisma.job.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Update skills if provided
    if (skills) {
      await prisma.jobSkill.deleteMany({ where: { jobId: req.params.id } });
      if (skills.length > 0) {
        await prisma.jobSkill.createMany({
          data: skills.map((s) => ({
            jobId: req.params.id,
            skillId: s.skillId,
            required: s.required,
            weight: s.weight,
          })),
        });
      }
    }

    // Update questionnaire if provided
    if (questionnaire) {
      await prisma.jobQuestionnaire.deleteMany({ where: { jobId: req.params.id } });
      if (questionnaire.questions.length > 0) {
        const q = await prisma.jobQuestionnaire.create({
          data: { jobId: req.params.id },
        });
        await prisma.questionnaireQuestion.createMany({
          data: questionnaire.questions.map((qq, index) => ({
            questionnaireId: q.id,
            questionText: qq.questionText,
            questionType: qq.questionType,
            options: qq.options,
            isRequired: qq.isRequired,
            order: qq.order || index,
          })),
        });
      }
    }

    const fullJob = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        jobSkills: { include: { skill: true } },
        questionnaire: { include: { questions: true } },
      },
    });

    return res.json(fullJob);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.job.findFirst({
      where: { id: req.params.id, hrId: req.user!.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await prisma.job.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Job deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const duplicateJob = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.job.findFirst({
      where: { id: req.params.id, hrId: req.user!.userId },
      include: {
        jobSkills: true,
        questionnaire: { include: { questions: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const newJob = await prisma.job.create({
      data: {
        hrId: req.user!.userId,
        title: `${existing.title} (Copy)`,
        description: existing.description,
        location: existing.location,
        jobType: existing.jobType,
        experienceMin: existing.experienceMin,
        experienceMax: existing.experienceMax,
        salaryMin: existing.salaryMin,
        salaryMax: existing.salaryMax,
        status: 'DRAFT',
        deadline: existing.deadline,
      },
    });

    if (existing.jobSkills.length > 0) {
      await prisma.jobSkill.createMany({
        data: existing.jobSkills.map((s) => ({
          jobId: newJob.id,
          skillId: s.skillId,
          required: s.required,
          weight: s.weight,
        })),
      });
    }

    if (existing.questionnaire) {
      const q = await prisma.jobQuestionnaire.create({
        data: { jobId: newJob.id },
      });
      if (existing.questionnaire.questions.length > 0) {
        await prisma.questionnaireQuestion.createMany({
          data: existing.questionnaire.questions.map((qq) => ({
            questionnaireId: q.id,
            questionText: qq.questionText,
            questionType: qq.questionType,
            options: qq.options,
            isRequired: qq.isRequired,
            order: qq.order,
          })),
        });
      }
    }

    const fullJob = await prisma.job.findUnique({
      where: { id: newJob.id },
      include: {
        jobSkills: { include: { skill: true } },
        questionnaire: { include: { questions: true } },
      },
    });

    return res.status(201).json(fullJob);
  } catch (error) {
    console.error('Duplicate job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
