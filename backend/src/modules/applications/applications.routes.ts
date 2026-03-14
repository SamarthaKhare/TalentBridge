import { Router } from 'express';
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  addNote,
  getSavedJobs,
  toggleSaveJob,
} from './applications.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Candidate routes
router.post('/', authenticate, authorize('CANDIDATE'), applyToJob);
router.get('/mine', authenticate, authorize('CANDIDATE'), getMyApplications);
router.delete('/:id', authenticate, authorize('CANDIDATE'), withdrawApplication);

// Saved jobs
router.get('/saved-jobs', authenticate, authorize('CANDIDATE'), getSavedJobs);
router.post('/saved-jobs/:jobId', authenticate, authorize('CANDIDATE'), toggleSaveJob);

// HR routes
router.get('/job/:jobId', authenticate, authorize('HR'), getJobApplications);
router.put('/:id/status', authenticate, authorize('HR'), updateApplicationStatus);
router.post('/:id/notes', authenticate, authorize('HR'), addNote);

export default router;
