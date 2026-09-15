import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserStore, AuditStore } from '../models/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_secure_file_sharing_system_2026';

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await UserStore.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserStore.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      isActive: true,
    });

    const token = jwt.sign(
      { id: newUser._id || newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await AuditStore.log({
      userId: newUser._id || newUser.id,
      userEmail: newUser.email,
      action: 'REGISTER',
      status: 'SUCCESS',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: `New account created as [${newUser.role}]`,
    });

    const { password: _, ...userData } = newUser;
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userData,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await UserStore.findByEmail(email);
    if (!user) {
      await AuditStore.log({
        userEmail: email,
        action: 'LOGIN',
        status: 'FAILURE',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        details: 'Login attempt failed: Email not found',
      });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated. Contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await AuditStore.log({
        userId: user._id || user.id,
        userEmail: user.email,
        action: 'LOGIN',
        status: 'FAILURE',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        details: 'Login attempt failed: Password incorrect',
      });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await AuditStore.log({
      userId: user._id || user.id,
      userEmail: user.email,
      action: 'LOGIN',
      status: 'SUCCESS',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: 'User logged in successfully',
    });

    const { password: _, ...userData } = user;
    res.json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

export async function getMe(req, res) {
  res.json({ user: req.user });
}

export async function listPotentialRecipients(req, res) {
  try {
    const users = await UserStore.listAll();
    // Exclude current user from the list
    const currentId = req.user._id || req.user.id;
    const filtered = users
      .filter(u => (u._id || u.id) !== currentId)
      .map(u => ({ id: u._id || u.id, name: u.name, email: u.email }));
    res.json({ recipients: filtered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve recipient list.' });
  }
}
