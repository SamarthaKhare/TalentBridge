import { Router } from 'express';
import { getHrDashboard, getCandidateDashboard } from './dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/hr', authenticate, authorize('HR'), getHrDashboard);
router.get('/candidate', authenticate, authorize('CANDIDATE'), getCandidateDashboard);

export default router;
