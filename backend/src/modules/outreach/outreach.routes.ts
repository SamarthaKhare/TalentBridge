import { Router } from 'express';
import { sendOutreach, getOutreachHistory } from './outreach.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/send', authenticate, authorize('HR'), sendOutreach);
router.get('/history', authenticate, authorize('HR'), getOutreachHistory);

export default router;
