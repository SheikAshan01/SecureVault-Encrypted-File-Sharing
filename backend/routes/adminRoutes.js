import express from 'express';
import {
  getSystemMetrics,
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  getAllFiles,
  getGlobalAuditLogs,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/metrics', getSystemMetrics);
router.get('/users', getAllUsers);
router.patch('/users/:userId/toggle-status', toggleUserStatus);
router.patch('/users/:userId/role', updateUserRole);
router.get('/files', getAllFiles);
router.get('/logs', getGlobalAuditLogs);

export default router;
