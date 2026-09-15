import mongoose, { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const FileSchema = new Schema({
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  sha256Checksum: { type: String, required: true },
  ivHex: { type: String, required: true },
  authTagHex: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  securityLevel: { type: String, enum: ['standard', 'confidential', 'top-secret'], default: 'confidential' },
  sharedWith: [
    {
      email: { type: String, required: true },
      permission: { type: String, enum: ['view', 'download'], default: 'download' },
      sharedAt: { type: Date, default: Date.now },
    }
  ],
  shareLink: {
    token: { type: String, default: null },
    isProtected: { type: Boolean, default: false },
    pin: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    maxDownloads: { type: Number, default: 0 }, // 0 = unlimited
    downloadsCount: { type: Number, default: 0 },
    allowDownload: { type: Boolean, default: true },
  },
  downloadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AuditLogSchema = new Schema({
  fileId: { type: String, default: null },
  fileName: { type: String, default: null },
  userId: { type: String, default: null },
  userEmail: { type: String, default: 'Anonymous / Guest' },
  action: { 
    type: String, 
    enum: ['UPLOAD', 'DOWNLOAD', 'VIEW', 'SHARE_CREATED', 'SHARE_REVOKED', 'ACCESS_DENIED', 'DELETE', 'LOGIN', 'REGISTER'], 
    required: true 
  },
  status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
  ipAddress: { type: String, default: '127.0.0.1' },
  userAgent: { type: String, default: 'Unknown' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

export const UserModel = model('User', UserSchema);
export const FileModel = model('File', FileSchema);
export const AuditLogModel = model('AuditLog', AuditLogSchema);
