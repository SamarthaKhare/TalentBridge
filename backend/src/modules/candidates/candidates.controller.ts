import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { candidateProfileSchema } from '../../utils/validators';
import { calculateProfileCompletion } from '../../utils/helpers';
import { invalidateRecommendations } from '../../services/recommendation.service';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        candidateSkills: { include: { skill: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const data = candidateProfileSchema.parse(req.body);
    const userId = req.user!.userId;

    const { skills, ...profileData } = data;

    const updateData: any = { ...profileData };
    if (data.graduationDate) {
      updateData.graduationDate = new Date(data.graduationDate);
    }

    const profile = await prisma.candidateProfile.update({
      where: { userId },
      data: updateData,
      include: { candidateSkills: true },
    });

    // Update skills if provided
    if (skills) {
      await prisma.candidateSkill.deleteMany({
        where: { candidateId: profile.id },
      });

      if (skills.length > 0) {
        await prisma.candidateSkill.createMany({
          data: skills.map((s) => ({
            candidateId: profile.id,
            skillId: s.skillId,
            proficiency: s.proficiency,
            years: s.years,
          })),
        });
      }
    }

    // Recalculate profile completion
    const updatedProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { candidateSkills: true },
    });

    if (updatedProfile) {
      const completionScore = calculateProfileCompletion(updatedProfile);
      await prisma.candidateProfile.update({
        where: { userId },
        data: { profileCompletionScore: completionScore },
      });
    }

    // Invalidate recommendation cache
    await invalidateRecommendations(userId);

    const finalProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        candidateSkills: { include: { skill: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return res.json(finalProfile);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadResumeFn = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const resumeUrl = `/uploads/${req.file.filename}`;

    await prisma.candidateProfile.update({
      where: { userId: req.user!.userId },
      data: { resumeUrl },
    });

    return res.json({ resumeUrl });
  } catch (error) {
    console.error('Upload resume error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
