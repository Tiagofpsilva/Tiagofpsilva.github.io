// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// 1. Replace this with your OAuth Client ID from Google Cloud Console
// 2. Make sure http://localhost:PORT and your Cloudflare domain are in
//    Authorized JavaScript Origins in GCP
const GOOGLE_CLIENT_ID = '783578084953-dr7j41nev36va5tj50m792fleng1fu2s.apps.googleusercontent.com';

// Optional: restrict to a specific Google Workspace domain
// e.g. 'yourcompany.com' — leave empty to allow any Google account
const ALLOWED_DOMAIN = '';

// Optional: allowlist specific emails (leave empty array to skip)
const ALLOWED_EMAILS = [];
// Example: const ALLOWED_EMAILS = ['you@gmail.com', 'friend@gmail.com'];
