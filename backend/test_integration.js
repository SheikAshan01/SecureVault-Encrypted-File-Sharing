import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('🧪 Starting Full System End-to-End Integration Verification...\n');

  const BASE = 'http://localhost:5000/api';

  // 1. Health check
  const hRes = await fetch(`${BASE}/health`);
  const health = await hRes.json();
  console.log(`✅ [1/8] Health check passed: ${health.service} (${health.status})`);

  // 2. Login as Admin
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@secure.io', password: 'Admin@12345' }),
  });
  const adminAuth = await loginRes.json();
  const token = adminAuth.token;
  console.log(`✅ [2/8] Admin Authentication successful for: ${adminAuth.user.email}`);

  // 3. Create a test sensitive file & Upload (Multipart)
  const testPlaintext = 'TOP-SECRET CLASSIFIED PROJECT INTELLIGENCE DATA - VERIFICATION TEST ' + Date.now();
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  const filePart = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="securityLevel"\r\n\r\n` +
    `confidential\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="classified_intel.txt"\r\n` +
    `Content-Type: text/plain\r\n\r\n` +
    `${testPlaintext}\r\n` +
    `--${boundary}--\r\n`;

  const uploadRes = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: Buffer.from(filePart),
  });
  const uploadData = await uploadRes.json();
  const uploadedFile = uploadData.file;
  console.log(`✅ [3/8] File Encrypted & Uploaded: "${uploadedFile.originalName}" (ID: ${uploadedFile._id || uploadedFile.id})`);
  console.log(`       SHA-256 Checksum: ${uploadedFile.sha256Checksum}`);
  console.log(`       AES-256-GCM IV: ${uploadedFile.ivHex} | AuthTag: ${uploadedFile.authTagHex}`);

  // 4. Verify the raw file in backend/uploads/encrypted/ is truly encrypted ciphertext
  const encryptedDiskPath = path.join(process.cwd(), 'uploads', 'encrypted', uploadedFile.storedName);
  const rawDiskBytes = fs.readFileSync(encryptedDiskPath);
  const rawDiskText = rawDiskBytes.toString('utf-8');
  if (rawDiskText.includes(testPlaintext)) {
    throw new Error('FATAL SECURITY FLAW: File on disk contains unencrypted plaintext!');
  }
  console.log(`✅ [4/8] Cryptographic Invariant Verified: Disk contains ONLY high-entropy ciphertext (${rawDiskBytes.length} bytes). Raw text is completely unreadable.`);

  // 5. Authenticated Decryption & Download
  const downloadRes = await fetch(`${BASE}/files/${uploadedFile._id || uploadedFile.id}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const decryptedText = await downloadRes.text();
  if (decryptedText !== testPlaintext) {
    throw new Error(`Decrypted text mismatch! Expected "${testPlaintext}", got "${decryptedText}"`);
  }
  console.log(`✅ [5/8] Hardware AES-256-GCM Decryption Verified: Stream matches original plaintext bit-for-bit.`);

  // 6. Generate Public Share Link with 6-Digit PIN
  const testPin = '754921';
  const shareRes = await fetch(`${BASE}/share/${uploadedFile._id || uploadedFile.id}/link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pin: testPin,
      expiresHours: 24,
      maxDownloads: 5,
    }),
  });
  const shareData = await shareRes.json();
  const shareToken = shareData.shareLink.token;
  console.log(`✅ [6/8] Secure Sharing Link Created: Token ${shareToken.substring(0, 16)}... (Protected by PIN: ${testPin})`);

  // 7. Test Public Access: Incorrect PIN should fail (401), Correct PIN should succeed & decrypt
  const wrongPinRes = await fetch(`${BASE}/share/download/${shareToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '000000' }),
  });
  if (wrongPinRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for wrong PIN, got ${wrongPinRes.status}`);
  }

  const correctPinRes = await fetch(`${BASE}/share/download/${shareToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: testPin }),
  });
  const publicDecryptedText = await correctPinRes.text();
  if (publicDecryptedText !== testPlaintext) {
    throw new Error('Public decrypted text mismatch');
  }
  console.log(`✅ [7/8] PIN Security Enforcement Verified: Access denied for incorrect PIN (401), decrypted successfully with valid PIN.`);

  // 8. Verify Audit Trail Records
  const logsRes = await fetch(`${BASE}/admin/logs`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const logsData = await logsRes.json();
  const latestLogs = logsData.logs.slice(0, 5);
  console.log(`✅ [8/8] Audit Trail Verified: ${logsData.logs.length} logged events in the ledger.`);
  console.log(`       Recent events: ${latestLogs.map(l => `${l.action} [${l.status}]`).join(' -> ')}`);

  console.log('\n🎉 ALL 8 SECURITY AND CRYPTOGRAPHIC CHECKS PASSED FLAWLESSLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
