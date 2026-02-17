// ═══════════════════════════════════════════════════════════════
// UI & DOM MANIPULATION
// ═══════════════════════════════════════════════════════════════

function renderFileList(list) {
  if (!list.length) {
    document.getElementById('fileList').innerHTML =
      '<div class="sidebar-empty">No results found.</div>';
    return;
  }

  document.getElementById('fileList').innerHTML = list.map(f => {
    const displayName = extractDisplayName(f.name);
    return `
    <div class="file-item ${f.id === activeFileId ? 'active' : ''}"
         id="fi-${f.id}"
         onclick="selectFile('${f.id}')"
         oncontextmenu="showContextMenu(event,'${f.id}')">
      <div class="file-icon">📄</div>
      <div class="file-meta">
        <div class="file-name">${escHtml(displayName)}</div>
        <div class="file-info">
          <span>${formatDate(f.modifiedTime)}</span>
          ${f.size ? `<span>·</span><span>${formatSize(f.size)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function filterFiles(q) {
  const lower = q.toLowerCase();
  const filtered = files.filter(f => {
    const displayName = extractDisplayName(f.name);
    return displayName.toLowerCase().includes(lower);
  });
  renderFileList(filtered);
}

function showEditor() {
  document.getElementById('emptyState').style.display = 'none';
  const w = document.getElementById('editorWrapper');
  w.style.display = 'flex';
  w.style.flexDirection = 'column';
  w.style.flex = '1';
  w.style.overflow = 'hidden';
}

function resetEditor() {
  activeFileId = null;
  isDirty = false;
  selectedPeople = [];
  renderPeopleChips();
  selectedTags = [];
  renderTagsChips();
  document.getElementById('editorWrapper').style.display = 'none';
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('saveBtn').style.display = 'none';
  updateMobileSaveButton(false);
}

function setLoading(on) {
  document.getElementById('wysiwygEditor').style.opacity = on ? '0.4' : '1';
}

function setSaving(on) {
  document.getElementById('savingIndicator').style.display = on ? 'flex' : 'none';
  document.getElementById('savedIndicator').style.display = on ? 'none' : 'flex';
}

function setSaved() {
  isDirty = false;
  setSaving(false);
  document.getElementById('savedIndicator').style.display = 'flex';
}

function setSyncing(on) {
  const btn = document.getElementById('syncBtn');
  btn.classList.toggle('spinning', on);
  const mobileBtn = document.getElementById('mobileSyncBtn');
  if (mobileBtn) {
    mobileBtn.classList.toggle('spinning', on);
  }
}

function updateStats() {
  const text = currentMode === 'wysiwyg'
    ? document.getElementById('wysiwygEditor').innerText
    : document.getElementById('rawEditor').value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = `${words} words`;
  document.getElementById('charCount').textContent = `${text.length} chars`;
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════════
// MOBILE INTERACTIONS
// ═══════════════════════════════════════════════════════════════

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  
  sidebar.classList.toggle('mobile-open');
  toggle.classList.toggle('sidebar-open');
  
  if (backdrop) {
    backdrop.classList.toggle('visible');
  }
}

function closeSidebarOnMobile() {
  // Close sidebar on mobile when a file is selected
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    sidebar.classList.remove('mobile-open');
    toggle.classList.remove('sidebar-open');
    
    if (backdrop) {
      backdrop.classList.remove('visible');
    }
  }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobileMenu');
  const burgerBtn = document.querySelector('.burger-btn');
  if (menu && burgerBtn && !menu.contains(e.target) && !burgerBtn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// Update mobile menu user info when user info changes
function updateMobileUserInfo() {
  if (currentUser) {
    const avatar = document.getElementById('mobileUserAvatar');
    const name = document.getElementById('mobileUserName');
    const email = document.getElementById('mobileUserEmail');
    
    if (currentUser.picture) {
      avatar.innerHTML = `<img src="${currentUser.picture}" alt="${currentUser.name}">`;
    } else {
      avatar.textContent = (currentUser.name || currentUser.email || '?')[0].toUpperCase();
    }
    
    name.textContent = currentUser.name || currentUser.email;
    email.textContent = currentUser.email;
  }
}

// Update mobile save button visibility
function updateMobileSaveButton(visible) {
  const mobileSaveBtn = document.getElementById('mobileSaveBtn');
  if (mobileSaveBtn) {
    mobileSaveBtn.style.display = visible ? 'flex' : 'none';
  }
}

