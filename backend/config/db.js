import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state for fallback store
const initialData = {
  users: [],
  files: [],
  auditLogs: [],
};

// In-memory / file-persisted local store
let localDb = { ...initialData };

function loadLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      localDb = JSON.parse(content);
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.error('Error loading local DB file, using empty state:', err);
    localDb = { ...initialData };
  }
}

export function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting local DB:', err);
  }
}

export let isMongoConnected = false;

export async function connectDB() {
  loadLocalDb();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure_file_sharing';
  
  try {
    // Attempt MongoDB connection with 3000ms server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${uri}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`ℹ️  MongoDB not reachable (${err.message}).`);
    console.log(`⚡ Activated high-performance local persistent store (backed by ${DB_FILE}).`);
  }
}

export { localDb };
