# 🛡️ SecureVault — Enterprise Encrypted File Sharing & Zero-Knowledge Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-blueviolet.svg)](#security-architecture)
[![Integrity](https://img.shields.io/badge/Integrity-SHA--256-brightgreen.svg)](#security-architecture)

**SecureVault** is an enterprise-grade, end-to-end encrypted file sharing and digital asset management platform. Built with hardware-grade **AES-256-GCM symmetric encryption**, zero-knowledge storage principles, cryptographic link sharing with PIN/expiration control, real-time audit logging, and an interactive **AI Security Advisor powered by Google Gemini**.

---

## 🌟 Key Highlights & Features

- 🔒 **Military-Grade AES-256-GCM Encryption**:
  - Files are encrypted in-memory as binary streams before reaching storage.
  - Raw unencrypted plaintext **never touches persistent disk**.
  - Generates a cryptographically secure 16-byte random IV and 16-byte GCM authentication tag per file to guarantee tamper-proof authenticity.
  - SHA-256 checksum generated per file for cryptographic integrity verification.

- 🔗 **Smart Link Sharing with PIN & Expiry**:
  - Cryptographically unique public download links.
  - Optional **6-Digit PIN Passkey** protection.
  - Flexible **Expiration Presets** (1m, 5m, 10m, 1h, 24h, 3d, 7d, or Custom Duration in Minutes/Hours/Days).
  - Configurable download burn limits (1-time burn links, up to N downloads, or unlimited).
  - Instant one-click link revocation.

- 👥 **User-to-User Granular Access Control**:
  - Directly grant access to registered email accounts with `Download` or `View Only` permission tiers.
  - Real-time permission updates and revocation.

- 📱 **100% Fully Responsive on All Devices**:
  - Mobile phones (320px - 480px), tablets (768px - 1024px), laptops, and desktop screens.
  - Animated off-canvas mobile navigation drawer with backdrop overlay and quick close buttons.
  - Responsive cards, fluid data grids, and smooth hardware touch-scrolling tables (`-webkit-overflow-scrolling: touch`).
  - Custom dropdowns engineered to never pop out of boundaries or cause horizontal overflow.

- 🎨 **Multi-Theme Glassmorphism UI**:
  - **Royal Indigo (Dark)**: Deep sleek slate with high-contrast violet and cyan accents.
  - **Mint Cyber (Matrix / Emerald)**: Obsidian glass with emerald green and cyan glow.
  - **Clean Crisp (Light)**: Modern high-contrast clean white with indigo highlights.

- 📜 **Forensics & Audit Trail Ledger**:
  - Permanent audit logging tracking every single event (`UPLOAD`, `DOWNLOAD`, `SHARE_CREATED`, `SHARE_REVOKED`, `ACCESS_DENIED`, `DELETE`).
  - Records ISO timestamp, client IP address (IPv4/IPv6), user agent, and status.

- 🤖 **AI Cybersecurity Advisor (Google Gemini)**:
  - Context-aware sensitivity classification and security recommendations.
  - Live AI tips for password entropy, cryptographic algorithms, and file protection policies.

- 👑 **System Administrator Governance Console**:
  - Real-time system health telemetry: storage consumed, user counts, file volume, and intrusion attempts.
  - User management: Suspend/reactivate accounts or change roles (`user` / `admin`).
  - Global file inspection ledger.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide React, Modern Vanilla CSS (Glassmorphism & Design Tokens) |
| **Backend** | Node.js (ESM), Express.js, Multer (Memory Storage) |
| **Cryptography** | Node.js Native `crypto` (AES-256-GCM, SHA-256, Random IV/AuthTag) |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing |
| **Database** | MongoDB (via Mongoose) with **automatic zero-setup JSON fallback** |
| **AI Integration** | Google Gemini API (`@google/genai` / Gemini 1.5 Pro/Flash) with smart local fallback |

---

## 📁 Directory Structure

```text
secure_file/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection with automatic local JSON fallback
│   │   └── encryption.js       # AES-256-GCM Cipher engine & SHA-256 hasher
│   ├── controllers/            # Auth, Files, Share, Public, Audit, Admin, AI
│   ├── middleware/             # JWT auth & admin role verification
│   ├── models/                 # Store schema (User, File, AuditLog)
│   ├── routes/                 # Express API routes
│   ├── uploads/encrypted/      # Storage for encrypted binary ciphertext
│   ├── server.js               # Express API entry point
│   └── test_integration.js     # End-to-end cryptographic test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, CustomSelect, Modals, FileCard, StatCard
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── pages/              # Dashboard, MyFiles, SharedWithMe, AuditLogs, Admin, Auth, Public
│   │   ├── services/api.js     # Axios API service client
│   │   ├── App.jsx             # Main router & modal state orchestrator
│   │   └── index.css           # Responsive design system & glassmorphism themes
│   ├── index.html
│   └── vite.config.js
│
└── README.md
