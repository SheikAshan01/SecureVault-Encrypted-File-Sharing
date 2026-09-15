import express from 'express';
import { askSecurityAdvisor } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/ask', authenticate, askSecurityAdvisor);

export default router;
