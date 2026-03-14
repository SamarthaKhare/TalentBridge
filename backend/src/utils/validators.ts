import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['HR', 'CANDIDATE']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const candidateProfileSchema = z.object({
  headline: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  noticePeriodDays: z.number().int().min(0).optional(),
  currentCtc: z.number().min(0).optional(),
  expectedCtc: z.number().min(0).optional(),
  graduationDate: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']),
        years: z.number().int().min(0).default(0),
      })
    )
    .optional(),
});

export const jobCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  jobType: z.enum(['REMOTE', 'ONSITE', 'HYBRID']).default('ONSITE'),
  experienceMin: z.number().int().min(0).optional(),
  experienceMax: z.number().int().min(0).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  status: z.enum(['DRAFT', 'OPEN']).default('DRAFT'),
  deadline: z.string().optional(),
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        required: z.boolean().default(false),
        weight: z.number().int().min(1).max(10).default(5),
      })
    )
    .optional(),
  questionnaire: z
    .object({
      questions: z.array(
        z.object({
          questionText: z.string().min(1),
          questionType: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']),
          options: z.array(z.string()).default([]),
          isRequired: z.boolean().default(false),
          order: z.number().int().min(0).default(0),
        })
      ),
    })
    .optional(),
});

export const jobUpdateSchema = jobCreateSchema.partial();

export const applicationCreateSchema = z.object({
  jobId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        answerText: z.string(),
      })
    )
    .optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED']),
});

export const outreachSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  candidateIds: z.array(z.string().uuid()).min(1, 'At least one candidate required'),
  applicationId: z.string().uuid().optional(),
});

export const applicationNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});
