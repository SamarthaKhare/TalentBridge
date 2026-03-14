import { Router } from 'express';
import { searchJobs, searchCandidates, suggestSkills } from './search.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/jobs', searchJobs);
router.get('/candidates', authenticate, authorize('HR'), searchCandidates);
router.get('/skills/suggest', suggestSkills);

export default router;
