import { v4 as uuidv4 } from 'uuid';
import { isMongoConnected, localDb, saveLocalDb } from '../config/db.js';
import { UserModel, FileModel, AuditLogModel } from './MongooseSchemas.js';

export const UserStore = {
  async findByEmail(email) {
    if (isMongoConnected) {
      return await UserModel.findOne({ email: email.toLowerCase() }).lean();
    }
    return localDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findById(id) {
    if (isMongoConnected) {
      return await UserModel.findById(id).lean();
    }
    return localDb.users.find(u => u._id === id || u.id === id) || null;
  },

  async create(userData) {
    const data = {
      ...userData,
      email: userData.email.toLowerCase(),
      role: userData.role || 'user',
      isActive: userData.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const doc = await UserModel.create(data);
      return doc.toObject();
    }

    data._id = uuidv4();
    localDb.users.push(data);
    saveLocalDb();
    return data;
  },

  async listAll() {
    if (isMongoConnected) {
      return await UserModel.find({}, '-password').lean();
    }
    return localDb.users.map(({ password, ...rest }) => rest);
  },

  async toggleActive(userId) {
    if (isMongoConnected) {
      const user = await UserModel.findById(userId);
      if (!user) return null;
      user.isActive = !user.isActive;
      await user.save();
      return user.toObject();
    }

    const user = localDb.users.find(u => u._id === userId || u.id === userId);
    if (!user) return null;
    user.isActive = !user.isActive;
    saveLocalDb();
    const { password, ...rest } = user;
    return rest;
  },

  async updateRole(userId, newRole) {
    if (isMongoConnected) {
      const user = await UserModel.findById(userId);
      if (!user) return null;
      user.role = newRole;
      await user.save();
      return user.toObject();
    }

    const user = localDb.users.find(u => u._id === userId || u.id === userId);
    if (!user) return null;
    user.role = newRole;
    saveLocalDb();
    const { password, ...rest } = user;
    return rest;
  }
};

export const FileStore = {
  async create(fileData) {
    const data = {
      ...fileData,
      sharedWith: fileData.sharedWith || [],
      shareLink: fileData.shareLink || {
        token: null,
        isProtected: false,
        pin: null,
        expiresAt: null,
        maxDownloads: 0,
        downloadsCount: 0,
        allowDownload: true,
      },
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const doc = await FileModel.create(data);
      return doc.toObject();
    }

    data._id = uuidv4();
    localDb.files.push(data);
    saveLocalDb();
    return data;
  },

  async findById(id) {
    if (isMongoConnected) {
      return await FileModel.findById(id).lean();
    }
    return localDb.files.find(f => f._id === id || f.id === id) || null;
  },

  async findByShareToken(token) {
    if (isMongoConnected) {
      return await FileModel.findOne({ 'shareLink.token': token }).lean();
    }
    return localDb.files.find(f => f.shareLink && f.shareLink.token === token) || null;
  },

  async findByOwner(ownerId) {
    if (isMongoConnected) {
      return await FileModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
    }
    return localDb.files
      .filter(f => f.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findSharedWithEmail(email) {
    const cleanEmail = email.toLowerCase();
    if (isMongoConnected) {
      return await FileModel.find({
        'sharedWith.email': cleanEmail,
      }).sort({ createdAt: -1 }).lean();
    }
    return localDb.files
      .filter(f => f.sharedWith && f.sharedWith.some(s => s.email.toLowerCase() === cleanEmail))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async listAll() {
    if (isMongoConnected) {
      return await FileModel.find().sort({ createdAt: -1 }).lean();
    }
    return [...localDb.files].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async update(id, updates) {
    const withUpdated = {
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };
    if (isMongoConnected) {
      return await FileModel.findByIdAndUpdate(id, withUpdated, { new: true }).lean();
    }
    const idx = localDb.files.findIndex(f => f._id === id || f.id === id);
    if (idx === -1) return null;
    localDb.files[idx] = { ...localDb.files[idx], ...withUpdated };
    saveLocalDb();
    return localDb.files[idx];
  },

  async incrementDownload(id, isShareLink = false) {
    if (isMongoConnected) {
      const updateObj = { $inc: { downloadCount: 1 } };
      if (isShareLink) {
        updateObj.$inc['shareLink.downloadsCount'] = 1;
      }
      return await FileModel.findByIdAndUpdate(id, updateObj, { new: true }).lean();
    }
    const file = localDb.files.find(f => f._id === id || f.id === id);
    if (file) {
      file.downloadCount = (file.downloadCount || 0) + 1;
      if (isShareLink && file.shareLink) {
        file.shareLink.downloadsCount = (file.shareLink.downloadsCount || 0) + 1;
      }
      saveLocalDb();
    }
    return file;
  },

  async delete(id) {
    if (isMongoConnected) {
      return await FileModel.findByIdAndDelete(id).lean();
    }
    const idx = localDb.files.findIndex(f => f._id === id || f.id === id);
    if (idx === -1) return null;
    const deleted = localDb.files.splice(idx, 1)[0];
    saveLocalDb();
    return deleted;
  }
};

export const AuditStore = {
  async log(entry) {
    const data = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const doc = await AuditLogModel.create(data);
      return doc.toObject();
    }

    data._id = uuidv4();
    localDb.auditLogs.unshift(data); // Prepend to keep newest first
    // Limit to latest 500 records in local json to prevent bloat
    if (localDb.auditLogs.length > 500) {
      localDb.auditLogs = localDb.auditLogs.slice(0, 500);
    }
    saveLocalDb();
    return data;
  },

  async findByFileId(fileId) {
    if (isMongoConnected) {
      return await AuditLogModel.find({ fileId }).sort({ timestamp: -1 }).limit(100).lean();
    }
    return localDb.auditLogs
      .filter(l => l.fileId === fileId)
      .slice(0, 100);
  },

  async listAll(limit = 100) {
    if (isMongoConnected) {
      return await AuditLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
    }
    return localDb.auditLogs.slice(0, limit);
  }
};
