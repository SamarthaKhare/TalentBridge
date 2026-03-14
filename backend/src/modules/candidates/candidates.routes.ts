import { Router } from 'express';
import { getProfile, updateProfile, uploadResumeFn } from './candidates.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { uploadResume } from '../../middleware/upload';

const router = Router();

router.get('/candidate', authenticate, authorize('CANDIDATE'), getProfile);
router.put('/candidate', authenticate, authorize('CANDIDATE'), updateProfile);
router.post('/resume', authenticate, authorize('CANDIDATE'), uploadResume, uploadResumeFn);

export default router;
