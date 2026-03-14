import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import {
  applicationCreateSchema,
  applicationStatusSchema,
  applicationNoteSchema,
} from '../../utils/validators';
import { calculateMatchScore } from '../../services/scoring.service';
import { sendEmail } from '../../services/email.service';

export const applyToJob = async (req: Request, res: Response) => {
  try {
    const data = applicationCreateSchema.parse(req.body);
    const userId = req.user!.userId;

    // Duplicate check
    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: data.jobId, candidateId: userId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Already applied to this job' });
    }

    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      include: { jobSkills: true },
    });
    if (!job || job.status !== 'OPEN') {
      return res.status(400).json({ error: 'Job is not available for applications' });
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { candidateSkills: true },
    });

    // Calculate match score
    let matchScore = 0;
    if (profile) {
      matchScore = calculateMatchScore(
        job.jobSkills.map((js) => ({ skillId: js.skillId, weight: js.weight, required: js.required })),
        profile.candidateSkills.map((cs) => ({ skillId: cs.skillId, proficiency: cs.proficiency, years: cs.years })),
        profile.experienceYears,
        job.experienceMin,
        job.experienceMax,
        profile.location,
        job.location,
        profile.noticePeriodDays,
        null
      );
    }

    // Validate answers if questionnaire exists
    const questionnaire = await prisma.jobQuestionnaire.findUnique({
      where: { jobId: data.jobId },
      include: { questions: true },
    });

    if (questionnaire) {
      const requiredQuestions = questionnaire.questions.filter((q) => q.isRequired);
      const answeredIds = new Set((data.answers || []).map((a) => a.questionId));

      for (const rq of requiredQuestions) {
        if (!answeredIds.has(rq.id)) {
          return res.status(400).json({ error: `Required question "${rq.questionText}" not answered` });
        }
      }
    }

    // Create application with answers atomically
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId: data.jobId,
          candidateId: userId,
          matchScore,
        },
      });

      if (data.answers && data.answers.length > 0) {
        await tx.applicationAnswer.createMany({
          data: data.answers.map((a) => ({
            applicationId: app.id,
            questionId: a.questionId,
            answerText: a.answerText,
          })),
        });
      }

      return app;
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      sendEmail({
        to: user.email,
        subject: `Application Confirmed: ${job.title}`,
        html: `<p>Hi ${user.name},</p><p>Your application for <strong>${job.title}</strong> has been submitted successfully.</p><p>Match Score: ${matchScore}%</p>`,
      }).catch(console.error);
    }

    return res.status(201).json(application);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('Apply error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { candidateId: req.user!.userId },
      include: {
        job: {
          include: {
            hr: { select: { name: true, hrProfile: true } },
            jobSkills: { include: { skill: true } },
          },
        },
        answers: { include: { question: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.jobId, hrId: req.user!.userId },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const applications = await prisma.application.findMany({
      where: { jobId: req.params.jobId },
      include: {
        candidate: {
          select: {
            name: true,
            email: true,
            candidateProfile: {
              include: { candidateSkills: { include: { skill: true } } },
            },
          },
        },
        answers: { include: { question: true } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { matchScore: 'desc' },
    });

    return res.json(applications);
  } catch (error) {
    console.error('Get job applications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const data = applicationStatusSchema.parse(req.body);

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true, candidate: true },
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.job.hrId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status: data.status },
    });

    // Send email notification
    sendEmail({
      to: application.candidate.email,
      subject: `Application Update: ${application.job.title}`,
      html: `<p>Hi ${application.candidate.name},</p><p>Your application for <strong>${application.job.title}</strong> has been updated to: <strong>${data.status}</strong></p>`,
    }).catch(console.error);

    return res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const withdrawApplication = async (req: Request, res: Response) => {
  try {
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, candidateId: req.user!.userId },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Delete the application entirely so the candidate can re-apply
    await prisma.applicationAnswer.deleteMany({ where: { applicationId: req.params.id } });
    await prisma.applicationNote.deleteMany({ where: { applicationId: req.params.id } });
    await prisma.outreachRecipient.deleteMany({ where: { applicationId: req.params.id } });
    await prisma.application.delete({ where: { id: req.params.id } });

    return res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const addNote = async (req: Request, res: Response) => {
  try {
    const data = applicationNoteSchema.parse(req.body);

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });
    if (!application || application.job.hrId !== req.user!.userId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const note = await prisma.applicationNote.create({
      data: {
        applicationId: req.params.id,
        content: data.content,
      },
    });

    return res.status(201).json(note);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('Add note error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSavedJobs = async (req: Request, res: Response) => {
  try {
    const saved = await prisma.savedJob.findMany({
      where: { candidateId: req.user!.userId },
      include: {
        job: {
          include: {
            jobSkills: { include: { skill: true } },
            hr: { select: { name: true, hrProfile: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    return res.json(saved);
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleSaveJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.savedJob.findUnique({
      where: { candidateId_jobId: { candidateId: userId, jobId } },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    }

    await prisma.savedJob.create({ data: { candidateId: userId, jobId } });
    return res.json({ saved: true });
  } catch (error) {
    console.error('Toggle save error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
