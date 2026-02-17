// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

function signIn() {
  if (!tokenClient) {
    showToast('Google Sign-In is still loading. Try again in a moment.', true);
    return;
  }
  tokenClient.requestAccessToken({ prompt: 'select_account' });
}

async function handleTokenResponse(resp) {
  if (resp.error) {
    showToast('Sign-in failed: ' + resp.error, true);
    return;
  }

  accessToken = resp.access_token;

  // Fetch user profile
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    currentUser = await r.json();
  } catch(e) {
    showToast('Could not fetch user profile', true);
    return;
  }

  // Check allowlist
  if (!isAllowed(currentUser.email)) {
    showToast(`Access denied for ${currentUser.email}`, true);
    google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
    return;
  }

  // Show app
  document.getElementById('loginScreen').style.display = 'none';
  const shell = document.getElementById('appShell');
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';

  // Populate user info
  document.getElementById('userEmail').textContent = currentUser.email;
  const avatar = document.getElementById('userAvatar');
  if (currentUser.picture) {
    avatar.innerHTML = `<img src="${currentUser.picture}" alt="">`;
  } else {
    avatar.textContent = currentUser.email[0].toUpperCase();
  }

  loadFiles();
}

function isAllowed(email) {
  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) return false;
  if (ALLOWED_DOMAIN && !email.endsWith('@' + ALLOWED_DOMAIN)) return false;
  return true;
}

function signOut() {
  if (accessToken) google.accounts.oauth2.revoke(accessToken);
  accessToken = null;
  currentUser = null;
  files = [];
  activeFileId = null;
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('fileList').innerHTML = '<div class="sidebar-loading"><div class="spinner"></div>Loading…</div>';
  resetEditor();
}
