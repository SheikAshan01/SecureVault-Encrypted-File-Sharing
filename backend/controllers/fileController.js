import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from '../config/encryption.js';
import { getClientIp } from '../config/ipHelper.js';
import { FileStore, AuditStore } from '../models/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'encrypted');

// Ensure encrypted uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided for upload.' });
    }

    const { securityLevel } = req.body;
    const originalFile = req.file;

    // Encrypt the in-memory file buffer directly with AES-256-GCM
    const { encryptedBuffer, iv, authTag, sha256 } = encryptBuffer(originalFile.buffer);

    // Generate unique stored filename
    const storedName = `${uuidv4()}.enc`;
    const targetPath = path.join(UPLOAD_DIR, storedName);

    // Write encrypted data to disk (Raw file is never written to disk in plaintext!)
    await fs.promises.writeFile(targetPath, encryptedBuffer);

    // Save record to database
    const fileRecord = await FileStore.create({
      originalName: originalFile.originalname,
      storedName,
      mimeType: originalFile.mimetype || 'application/octet-stream',
      sizeBytes: originalFile.size,
      sha256Checksum: sha256,
      ivHex: iv,
      authTagHex: authTag,
      ownerId: req.user._id || req.user.id,
      ownerEmail: req.user.email,
      securityLevel: securityLevel || 'confidential',
    });

    // Log upload in audit logs
    await AuditStore.log({
      fileId: fileRecord._id || fileRecord.id,
      fileName: fileRecord.originalName,
      userId: req.user._id || req.user.id,
      userEmail: req.user.email,
      action: 'UPLOAD',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `File encrypted with AES-256-GCM (SHA-256: ${sha256.substring(0, 16)}...)`,
    });

    res.status(201).json({
      message: 'File successfully encrypted and stored.',
      file: fileRecord,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: 'File encryption or storage failed.' });
  }
}

export async function getMyFiles(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const files = await FileStore.findByOwner(userId);
    res.json({ files });
  } catch (err) {
    console.error('Get files error:', err);
    res.status(500).json({ message: 'Failed to fetch files.' });
  }
}

export async function getSharedWithMe(req, res) {
  try {
    const files = await FileStore.findSharedWithEmail(req.user.email);
    res.json({ files });
  } catch (err) {
    console.error('Get shared files error:', err);
    res.status(500).json({ message: 'Failed to fetch shared files.' });
  }
}

export async function downloadFile(req, res) {
  try {
    const { id } = req.params;
    const file = await FileStore.findById(id);

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email.toLowerCase();
    const isOwner = file.ownerId === userId;
    const isAdmin = req.user.role === 'admin';
    const sharedEntry = (file.sharedWith || []).find(s => s.email.toLowerCase() === userEmail);

    // Permission check
    if (!isOwner && !isAdmin) {
      if (!sharedEntry) {
        await AuditStore.log({
          fileId: file._id || file.id,
          fileName: file.originalName,
          userId,
          userEmail,
          action: 'ACCESS_DENIED',
          status: 'FAILURE',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          details: 'Unauthorized download attempt: User not granted access',
        });
        return res.status(403).json({ message: 'Access denied. You do not have permission to access this file.' });
      }

      if (sharedEntry.permission === 'view') {
        await AuditStore.log({
          fileId: file._id || file.id,
          fileName: file.originalName,
          userId,
          userEmail,
          action: 'ACCESS_DENIED',
          status: 'FAILURE',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          details: 'Unauthorized download attempt: File permission is set to "View Only"',
        });
        return res.status(403).json({ message: 'You only have View permissions for this file.' });
      }
    }

    const filePath = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Encrypted file blob missing from vault.' });
    }

    // Read ciphertext and decrypt
    const encryptedBuffer = await fs.promises.readFile(filePath);
    let decryptedBuffer;
    try {
      decryptedBuffer = decryptBuffer(encryptedBuffer, file.ivHex, file.authTagHex);
    } catch (cryptoErr) {
      console.error('Decryption failed:', cryptoErr);
      return res.status(500).json({ message: 'Decryption failed. Data may have been tampered with.' });
    }

    // Increment download counter
    await FileStore.incrementDownload(file._id || file.id);

    // Record download in audit log
    await AuditStore.log({
      fileId: file._id || file.id,
      fileName: file.originalName,
      userId,
      userEmail,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `File decrypted & downloaded by ${req.user.email}`,
    });

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Failed to download and decrypt file.' });
  }
}

export async function deleteFile(req, res) {
  try {
    const { id } = req.params;
    const file = await FileStore.findById(id);

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    const isOwner = file.ownerId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the file owner or an administrator can delete this file.' });
    }

    // Delete encrypted file from disk
    const filePath = path.join(UPLOAD_DIR, file.storedName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Delete record from DB
    await FileStore.delete(id);

    await AuditStore.log({
      fileId: id,
      fileName: file.originalName,
      userId,
      userEmail: req.user.email,
      action: 'DELETE',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `File deleted from vault by ${req.user.email}`,
    });

    res.json({ message: 'File permanently deleted.' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: 'Failed to delete file.' });
  }
}
