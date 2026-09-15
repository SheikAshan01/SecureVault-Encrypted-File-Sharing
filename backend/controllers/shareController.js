import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateShareToken, decryptBuffer } from '../config/encryption.js';
import { getClientIp } from '../config/ipHelper.js';
import { FileStore, AuditStore } from '../models/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'encrypted');

export async function shareWithUser(req, res) {
  try {
    const { id } = req.params;
    const { email, permission } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Recipient email is required.' });
    }

    const file = await FileStore.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    if (file.ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the owner or admin can share this file.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingShared = file.sharedWith || [];
    const index = existingShared.findIndex(s => s.email.toLowerCase() === cleanEmail);

    if (index >= 0) {
      existingShared[index].permission = permission || 'download';
      existingShared[index].sharedAt = new Date().toISOString();
    } else {
      existingShared.push({
        email: cleanEmail,
        permission: permission || 'download',
        sharedAt: new Date().toISOString(),
      });
    }

    const updated = await FileStore.update(id, { sharedWith: existingShared });

    await AuditStore.log({
      fileId: id,
      fileName: file.originalName,
      userId,
      userEmail: req.user.email,
      action: 'SHARE_CREATED',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `Granted [${permission || 'download'}] access to ${cleanEmail}`,
    });

    res.json({ message: 'File shared successfully', file: updated });
  } catch (err) {
    console.error('Share with user error:', err);
    res.status(500).json({ message: 'Failed to share file.' });
  }
}

export async function removeSharedUser(req, res) {
  try {
    const { id, userEmail } = req.params;
    const file = await FileStore.findById(id);

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    if (file.ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    const cleanEmail = decodeURIComponent(userEmail).toLowerCase();
    const updatedShared = (file.sharedWith || []).filter(s => s.email.toLowerCase() !== cleanEmail);

    const updated = await FileStore.update(id, { sharedWith: updatedShared });

    await AuditStore.log({
      fileId: id,
      fileName: file.originalName,
      userId,
      userEmail: req.user.email,
      action: 'SHARE_REVOKED',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `Revoked access from ${cleanEmail}`,
    });

    res.json({ message: 'Access revoked', file: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke access.' });
  }
}

export async function generatePublicLink(req, res) {
  try {
    const { id } = req.params;
    const { pin, expiresHours, expiresMinutes, maxDownloads, allowDownload } = req.body;

    const file = await FileStore.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    if (file.ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const token = generateShareToken();
    let expiresAt = null;
    if (expiresMinutes !== undefined && Number(expiresMinutes) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresMinutes) * 60 * 1000).toISOString();
    } else if (expiresHours && Number(expiresHours) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresHours) * 3600 * 1000).toISOString();
    }

    const shareLink = {
      token,
      isProtected: Boolean(pin && pin.trim().length > 0),
      pin: pin ? pin.trim() : null,
      expiresAt,
      maxDownloads: Number(maxDownloads) || 0,
      downloadsCount: 0,
      allowDownload: allowDownload !== false,
    };

    const updated = await FileStore.update(id, { shareLink });

    await AuditStore.log({
      fileId: id,
      fileName: file.originalName,
      userId,
      userEmail: req.user.email,
      action: 'SHARE_CREATED',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `Generated public link (PIN: ${shareLink.isProtected ? 'Yes' : 'No'}, Expires: ${expiresAt || 'Never'})`,
    });

    res.json({
      message: 'Secure sharing link created',
      shareLink: updated.shareLink,
      file: updated,
    });
  } catch (err) {
    console.error('Generate link error:', err);
    res.status(500).json({ message: 'Failed to generate link.' });
  }
}

export async function revokePublicLink(req, res) {
  try {
    const { id } = req.params;
    const file = await FileStore.findById(id);

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    if (file.ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const updated = await FileStore.update(id, {
      shareLink: {
        token: null,
        isProtected: false,
        pin: null,
        expiresAt: null,
        maxDownloads: 0,
        downloadsCount: 0,
        allowDownload: true,
      }
    });

    await AuditStore.log({
      fileId: id,
      fileName: file.originalName,
      userId,
      userEmail: req.user.email,
      action: 'SHARE_REVOKED',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: 'Public share link revoked',
    });

    res.json({ message: 'Public link revoked successfully', file: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke link.' });
  }
}

export async function getPublicFileInfo(req, res) {
  try {
    const { token } = req.params;
    const file = await FileStore.findByShareToken(token);

    if (!file || !file.shareLink || file.shareLink.token !== token) {
      return res.status(404).json({ message: 'Invalid or expired secure link.' });
    }

    // Check expiration
    if (file.shareLink.expiresAt && new Date(file.shareLink.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'This secure sharing link has expired.' });
    }

    // Check max downloads
    if (file.shareLink.maxDownloads > 0 && file.shareLink.downloadsCount >= file.shareLink.maxDownloads) {
      return res.status(410).json({ message: 'This link has reached its maximum download limit.' });
    }

    res.json({
      originalName: file.originalName,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
      sha256Checksum: file.sha256Checksum,
      securityLevel: file.securityLevel,
      isProtected: file.shareLink.isProtected,
      expiresAt: file.shareLink.expiresAt,
      maxDownloads: file.shareLink.maxDownloads,
      downloadsCount: file.shareLink.downloadsCount,
      allowDownload: file.shareLink.allowDownload,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify secure link.' });
  }
}

export async function downloadPublicFile(req, res) {
  try {
    const { token } = req.params;
    const { pin } = req.body;
    const file = await FileStore.findByShareToken(token);

    if (!file || !file.shareLink || file.shareLink.token !== token) {
      return res.status(404).json({ message: 'Invalid or expired secure link.' });
    }

    const shareConfig = file.shareLink;

    // Check expiry
    if (shareConfig.expiresAt && new Date(shareConfig.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Link expired.' });
    }

    // Check max downloads
    if (shareConfig.maxDownloads > 0 && shareConfig.downloadsCount >= shareConfig.maxDownloads) {
      return res.status(410).json({ message: 'Download limit exceeded.' });
    }

    // Check PIN protection
    if (shareConfig.isProtected) {
      if (!pin || pin.toString().trim() !== shareConfig.pin.toString().trim()) {
        await AuditStore.log({
          fileId: file._id || file.id,
          fileName: file.originalName,
          userEmail: 'Anonymous Link Visitor',
          action: 'ACCESS_DENIED',
          status: 'FAILURE',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          details: 'Failed PIN attempt on protected share link',
        });
        return res.status(401).json({ message: 'Incorrect security PIN.' });
      }
    }

    const filePath = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Encrypted file not found in vault.' });
    }

    const encryptedBuffer = await fs.promises.readFile(filePath);
    const decryptedBuffer = decryptBuffer(encryptedBuffer, file.ivHex, file.authTagHex);

    // Increment counters
    await FileStore.incrementDownload(file._id || file.id, true);

    await AuditStore.log({
      fileId: file._id || file.id,
      fileName: file.originalName,
      userEmail: 'Guest via Secure Link',
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      details: `Public link download (Remaining: ${shareConfig.maxDownloads > 0 ? (shareConfig.maxDownloads - shareConfig.downloadsCount - 1) : 'Unlimited'})`,
    });

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('Public download error:', err);
    res.status(500).json({ message: 'Failed to decrypt and download file.' });
  }
}
