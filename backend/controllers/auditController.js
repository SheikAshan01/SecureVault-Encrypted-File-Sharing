import { FileStore, AuditStore } from '../models/store.js';

export async function getFileHistory(req, res) {
  try {
    const { id } = req.params;
    const file = await FileStore.findById(id);

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const userId = req.user._id || req.user.id;
    if (file.ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view access history for this file.' });
    }

    const logs = await AuditStore.findByFileId(id);
    res.json({ logs });
  } catch (err) {
    console.error('File history error:', err);
    res.status(500).json({ message: 'Failed to fetch download and access history.' });
  }
}
