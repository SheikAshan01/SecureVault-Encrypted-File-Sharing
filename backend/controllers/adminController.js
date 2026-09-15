import { UserStore, FileStore, AuditStore } from '../models/store.js';

export async function getSystemMetrics(req, res) {
  try {
    const users = await UserStore.listAll();
    const files = await FileStore.listAll();
    const logs = await AuditStore.listAll(100);

    const totalStorageBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
    const totalDownloads = files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
    const activeShareLinks = files.filter(f => f.shareLink && f.shareLink.token).length;

    // Count security levels
    const securityBreakdown = {
      standard: files.filter(f => f.securityLevel === 'standard').length,
      confidential: files.filter(f => f.securityLevel === 'confidential').length,
      topSecret: files.filter(f => f.securityLevel === 'top-secret').length,
    };

    // Calculate access denials / security alerts
    const securityAlerts = logs.filter(l => l.action === 'ACCESS_DENIED' || l.status === 'FAILURE').length;

    res.json({
      metrics: {
        totalUsers: users.length,
        totalFiles: files.length,
        totalStorageBytes,
        totalDownloads,
        activeShareLinks,
        securityAlerts,
        securityBreakdown,
      },
    });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ message: 'Failed to compute system metrics.' });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await UserStore.listAll();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user list.' });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const updated = await UserStore.toggleActive(userId);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User status updated', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user status.' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const updated = await UserStore.updateRole(userId, role);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User role updated', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role.' });
  }
}

export async function getAllFiles(req, res) {
  try {
    const files = await FileStore.listAll();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all files.' });
  }
}

export async function getGlobalAuditLogs(req, res) {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await AuditStore.listAll(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve audit logs.' });
  }
}
