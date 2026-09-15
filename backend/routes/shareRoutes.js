import express from 'express';
import {
  shareWithUser,
  removeSharedUser,
  generatePublicLink,
  revokePublicLink,
  getPublicFileInfo,
  downloadPublicFile,
} from '../controllers/shareController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Publicly accessible endpoints for link recipients
router.get('/info/:token', getPublicFileInfo);
router.post('/download/:token', downloadPublicFile);

// Authenticated endpoints for file owners
router.post('/:id/user', authenticate, shareWithUser);
router.delete('/:id/user/:userEmail', authenticate, removeSharedUser);
router.post('/:id/link', authenticate, generatePublicLink);
router.delete('/:id/link', authenticate, revokePublicLink);

export default router;
