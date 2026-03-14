import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { outreachSchema } from '../../utils/validators';
import { sendBulkEmails } from '../../services/email.service';

export const sendOutreach = async (req: Request, res: Response) => {
  try {
    const data = outreachSchema.parse(req.body);
    const hrId = req.user!.userId;

    const hr = await prisma.user.findUnique({
      where: { id: hrId },
      include: { hrProfile: true },
    });

    const candidates = await prisma.user.findMany({
      where: { id: { in: data.candidateIds }, role: 'CANDIDATE' },
      select: { id: true, email: true, name: true },
    });

    if (candidates.length === 0) {
      return res.status(400).json({ error: 'No valid candidates found' });
    }

    // Create outreach record
    const outreach = await prisma.outreachEmail.create({
      data: {
        hrId,
        subject: data.subject,
        body: data.body,
        recipientCount: candidates.length,
      },
    });

    // Send emails async
    const companyName = hr?.hrProfile?.companyName || '';
    const result = await sendBulkEmails(
      candidates.map((c) => ({ email: c.email, name: c.name })),
      data.subject,
      data.body,
      undefined,
      companyName
    );

    // Create recipient records
    await prisma.outreachRecipient.createMany({
      data: candidates.map((c) => ({
        outreachId: outreach.id,
        candidateId: c.id,
        applicationId: data.applicationId || null,
        status: 'SENT',
      })),
    });

    return res.json({
      outreachId: outreach.id,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('Send outreach error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOutreachHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.outreachEmail.findMany({
      where: { hrId: req.user!.userId },
      include: {
        recipients: {
          include: { candidate: { select: { name: true, email: true } } },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    return res.json(history);
  } catch (error) {
    console.error('Get outreach history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
