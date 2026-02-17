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
