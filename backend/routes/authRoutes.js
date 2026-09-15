import express from 'express';
import { register, login, getMe, listPotentialRecipients } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/recipients', authenticate, listPotentialRecipients);

export default router;
