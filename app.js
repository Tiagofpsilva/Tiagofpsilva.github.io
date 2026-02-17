// ═══════════════════════════════════════════════════════════════
// APPLICATION INITIALIZATION
// ═══════════════════════════════════════════════════════════════

window.onload = () => {
  // Check config (optional: show warning banner if using default client ID)
  const banner = document.getElementById('configBanner');
  if (banner && GOOGLE_CLIENT_ID === '783578084953-dr7j41nev36va5tj50m792fleng1fu2s.apps.googleusercontent.com') {
    banner.style.display = 'block';
  }

  // Wait for GIS to load then set up token client
  const initGIS = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file email profile',
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
