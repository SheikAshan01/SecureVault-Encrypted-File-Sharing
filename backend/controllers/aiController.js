/**
 * AI Controller for Intelligent Security Recommendations and Cybersecurity Assistant
 * Supports Google Gemini API with smart heuristic cybersecurity fallback.
 */

export async function askSecurityAdvisor(req, res) {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt query is required.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // If user has provided a Gemini API Key, call Google Gemini 1.5 Flash
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `You are an expert Cybersecurity & Data Privacy AI Advisor embedded in a Secure File Sharing System. 
Context: ${JSON.stringify(context || {})}
User Question: ${prompt}
Provide clear, actionable, technical yet easy-to-understand security recommendations. Keep it concise with bullet points.`
                    }
                  ]
                }
              ]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({
              reply: replyText,
              provider: 'Google Gemini 1.5 Flash (Live AI)',
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to embedded cybersecurity engine:', geminiErr.message);
      }
    }

    // Intelligent built-in cybersecurity analysis engine (Offline/Default mode)
    const reply = generateSmartSecurityAdvice(prompt, context);
    res.json({
      reply,
      provider: 'SecureVault AI Security Engine',
    });
  } catch (err) {
    console.error('AI advisor error:', err);
    res.status(500).json({ message: 'Failed to process security query.' });
  }
}

/**
 * Intelligent domain-specific security rules & advice generator
 */
function generateSmartSecurityAdvice(prompt, context = {}) {
  const query = prompt.toLowerCase();

  if (query.includes('encrypt') || query.includes('aes')) {
    return `### 🛡️ AES-256-GCM Encryption Architecture
- **Algorithm**: Advanced Encryption Standard with 256-bit key in **Galois/Counter Mode (GCM)**.
- **Authentication Tag**: Generates a 16-byte cryptographic authentication tag that detects any bit tampering or corruption before decryption.
- **Initialization Vector (IV)**: A unique, cryptographically random 16-byte IV is generated for every individual file upload to prevent pattern leakage.
- **Storage Security**: Only encrypted ciphertext binaries are saved on disk. Plaintext never touches persistent storage without authorization.`;
  }

  if (query.includes('share') || query.includes('link') || query.includes('pin') || query.includes('expire')) {
    return `### 🔐 Best Practices for Secure Link Sharing
1. **Enable PIN Protection**: Always configure a 6-digit access PIN and transmit it through an alternative channel (e.g., SMS or Signal) to maintain out-of-band security.
2. **Set Strict Expiry**: Never leave confidential files with permanent access. Choose **1 hour** for sensitive transactions or **24 hours** for standard transfers.
3. **Enforce Download Limits**: For one-off contract signings or credentials, enable a **1-time download limit** so the link self-terminates immediately upon retrieval.
4. **Audit History**: Inspect the Download History tab frequently to ensure unauthorized IP addresses are not accessing the link.`;
  }

  if (query.includes('password') || query.includes('auth') || query.includes('jwt')) {
    return `### 🔑 Authentication & Password Policy Advice
- **Password Strength**: Passwords are saved using **Bcrypt with 10 salt rounds**, making brute-force attacks computationally infeasible.
- **JWT Lifespan**: Access tokens expire automatically and should be stored securely in memory or HTTP-only cookies.
- **MFA Recommendation**: Ensure two-factor authentication is enabled when dealing with medical, financial, or legal databases.`;
  }

  if (query.includes('audit') || query.includes('log') || query.includes('track')) {
    return `### 📜 Audit Trail & Compliance Standards
- **Real-Time Logging**: Every action (\`UPLOAD\`, \`DOWNLOAD\`, \`SHARE_CREATED\`, \`ACCESS_DENIED\`) is logged with timestamps, IP addresses, and user-agent strings.
- **Forensics & Incident Response**: Failed access attempts are logged as security alerts in the Admin Dashboard to identify potential brute-force or unauthorized probing.
- **Compliance Alignment**: Helps organizations comply with **GDPR (Article 32)**, **HIPAA (Security Rule)**, and **ISO 27001**.`;
  }

  // Default holistic security recommendation
  return `### 🛡️ AI Security Recommendations for "${prompt.slice(0, 50)}"
- **Data Classification**: Classify your document appropriately: *Standard*, *Confidential*, or *Top-Secret*.
- **Least Privilege Access**: Only share files with specific users using "View Only" permission if they do not explicitly require downloading a local copy.
- **Out-of-Band Verification**: If using a public link with a PIN, share the PIN via an independent communication channel (e.g., voice call or encrypted chat).
- **Periodic Revocation**: Review active shared links in your vault and immediately revoke links that are no longer required.`;
}
