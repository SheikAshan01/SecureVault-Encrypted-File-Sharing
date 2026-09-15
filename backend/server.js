import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { UserStore } from './models/store.js';

import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all frontend origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Secure File Sharing Engine',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Seed default users if store is empty
async function seedDefaultUsers() {
  try {
    const existingAdmin = await UserStore.findByEmail('admin@secure.io');
    if (!existingAdmin) {
      const adminPass = await bcrypt.hash('Admin@12345', 10);
      await UserStore.create({
        name: 'Chief Security Officer',
        email: 'admin@secure.io',
        password: adminPass,
        role: 'admin',
        isActive: true,
      });
      console.log('🛡️  Created default admin: admin@secure.io (Password: Admin@12345)');
    }

    const existingUser = await UserStore.findByEmail('alex@company.com');
    if (!existingUser) {
      const userPass = await bcrypt.hash('User@12345', 10);
      await UserStore.create({
        name: 'Alex Vance',
        email: 'alex@company.com',
        password: userPass,
        role: 'user',
        isActive: true,
      });
      console.log('👤 Created demo user: alex@company.com (Password: User@12345)');
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

// Start Server
async function start() {
  await connectDB();
  await seedDefaultUsers();

  app.listen(PORT, () => {
    console.log(`🚀 Secure File Sharing Backend running on http://localhost:${PORT}`);
  });
}

start();
