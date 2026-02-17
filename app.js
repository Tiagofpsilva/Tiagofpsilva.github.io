// ═══════════════════════════════════════════════════════════════
// APPLICATION INITIALIZATION
// ═══════════════════════════════════════════════════════════════

window.onload = () => {
  // Initialize event handlers
  initEventHandlers();
  
  // Check config (optional: show warning banner if using default client ID)
  const banner = document.getElementById('configBanner');
  if (banner && GOOGLE_CLIENT_ID === '783578084953-dr7j41nev36va5tj50m792fleng1fu2s.apps.googleusercontent.com') {
    banner.style.display = 'block';
  }

  // Check for stored token and attempt to restore session
  const storedToken = localStorage.getItem('markpad_token');
  const storedUser = localStorage.getItem('markpad_user');
  
  if (storedToken && storedUser) {
    // Restore session from localStorage
    accessToken = storedToken;
    currentUser = JSON.parse(storedUser);
    
    // Validate token by making a test request
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(r => {
      if (r.ok) {
        // Token is still valid, restore session
        showAppInterface();
      } else {
        // Token expired, clear and show login
        localStorage.removeItem('markpad_token');
        localStorage.removeItem('markpad_user');
        accessToken = null;
        currentUser = null;
      }
    })
    .catch(() => {
      // Network error or invalid token
      localStorage.removeItem('markpad_token');
      localStorage.removeItem('markpad_user');
      accessToken = null;
      currentUser = null;
    });
  }

  // Wait for GIS to load then set up token client
  const initGIS = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets email profile',
      callback: handleTokenResponse,
    });
  };

  if (typeof google !== 'undefined') {
    initGIS();
  } else {
    // GIS script still loading
    const script = document.querySelector('script[src*="accounts.google.com/gsi"]');
    script.addEventListener('load', initGIS);
  }
};
