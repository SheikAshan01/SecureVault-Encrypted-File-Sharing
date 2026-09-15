import jwt from 'jsonwebtoken';
import { UserStore } from '../models/store.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';

    const decoded = jwt.verify(token, secret);
    const user = await UserStore.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found or session invalid.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    // Attach user without password
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Administrator rights required.' });
  }
  next();
}
