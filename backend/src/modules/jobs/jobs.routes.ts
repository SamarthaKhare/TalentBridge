import { Router } from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  duplicateJob,
} from './jobs.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', authenticate, authorize('HR'), createJob);
router.put('/:id', authenticate, authorize('HR'), updateJob);
router.delete('/:id', authenticate, authorize('HR'), deleteJob);
router.post('/:id/duplicate', authenticate, authorize('HR'), duplicateJob);

export default router;
