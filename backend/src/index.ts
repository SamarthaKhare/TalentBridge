import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import path from 'path';
import { config } from './config';
import prisma from './config/prisma';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import candidateRoutes from './modules/candidates/candidates.routes';
import jobRoutes from './modules/jobs/jobs.routes';
import applicationRoutes from './modules/applications/applications.routes';
import searchRoutes from './modules/search/search.routes';
import outreachRoutes from './modules/outreach/outreach.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { authenticate } from './middleware/auth';
import { getJobRecommendations } from './services/recommendation.service';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    return res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Recommendations
app.get('/api/recommendations/jobs', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'CANDIDATE') {
      return res.status(403).json({ error: 'Candidates only' });
    }
    const recommendations = await getJobRecommendations(req.user.userId);
    return res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
app.use(errorHandler);

// Job expiry cron — runs daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const expiredJobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
        deadline: { lt: now },
      },
      include: { hr: true },
    });

    if (expiredJobs.length > 0) {
      await prisma.job.updateMany({
        where: { id: { in: expiredJobs.map((j) => j.id) } },
        data: { status: 'CLOSED' },
      });
      console.log(`Auto-closed ${expiredJobs.length} expired jobs`);
    }
  } catch (error) {
    console.error('Job expiry cron error:', error);
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`TalentBridge API running on port ${config.port}`);
});

export default app;
