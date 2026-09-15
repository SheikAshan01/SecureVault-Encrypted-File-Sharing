import express from 'express';
import multer from 'multer';
import { uploadFile, getMyFiles, getSharedWithMe, downloadFile, deleteFile } from '../controllers/fileController.js';
import { getFileHistory } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer with memory storage (max 50MB per file) so plaintext is never cached on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/my-files', getMyFiles);
router.get('/shared-with-me', getSharedWithMe);
router.get('/:id/download', downloadFile);
router.get('/:id/history', getFileHistory);
router.delete('/:id', deleteFile);

export default router;
