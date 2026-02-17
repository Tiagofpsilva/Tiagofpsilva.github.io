// ═══════════════════════════════════════════════════════════════
// GOOGLE DRIVE OPERATIONS
// ═══════════════════════════════════════════════════════════════

async function driveRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    }
  });

  if (res.status === 401) {
    showToast('Session expired — please sign in again', true);
    signOut();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Drive API error:', res.status, errorText);
    throw new Error(`Drive API error: ${res.status}`);
  }

  return res;
}

async function ensureMarkpadFolder() {
  try {
    // Check if Markpad folder already exists
    const searchQuery = encodeURIComponent(
      "name = 'Markpad' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    );
    const searchRes = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&fields=files(id,name)`
    );
    const searchData = await searchRes.json();
    
    if (searchData.files && searchData.files.length > 0) {
      // Folder exists, use it
      markpadFolderId = searchData.files[0].id;
      return markpadFolderId;
    }
    
    // Create Markpad folder
    const metadata = {
      name: 'Markpad',
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const createRes = await driveRequest(
      'https://www.googleapis.com/drive/v3/files?fields=id',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
      }
    );
    
    const createData = await createRes.json();
    markpadFolderId = createData.id;
    showToast('📁 Created Markpad folder in your Drive');
    return markpadFolderId;
  } catch(e) {
    console.error('Error ensuring Markpad folder:', e);
    showToast('Could not create Markpad folder', true);
    throw e;
  }
}

async function loadFiles() {
  setSyncing(true);
  document.getElementById('fileList').innerHTML = '<div class="sidebar-loading"><div class="spinner"></div>Loading…</div>';

  try {
    // Ensure we have the Markpad folder
    if (!markpadFolderId) {
      await ensureMarkpadFolder();
    }
    
    // Query Drive for .md files in Markpad folder only
    const query = encodeURIComponent(
      `name contains '.md' and mimeType = 'text/plain' and '${markpadFolderId}' in parents and trashed = false`
    );
    const res = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime+desc&pageSize=50`
    );
    const data = await res.json();
    files = data.files || [];

    renderFileList(files);
    setSyncing(false);

    if (files.length === 0) {
      document.getElementById('fileList').innerHTML =
        '<div class="sidebar-empty">No notes in Markpad folder yet.<br>Create one to get started.</div>';
    }
  } catch(e) {
    if (e.message !== 'Unauthorized') {
      document.getElementById('fileList').innerHTML =
        '<div class="sidebar-empty">Failed to load files.<br>Check your connection.</div>';
      showToast('Could not load files from Drive', true);
    }
    setSyncing(false);
  }
}

async function selectFile(id) {
  if (isDirty && activeFileId) {
    await autoSave(); // save current before switching
  }

  activeFileId = id;
  const file = files.find(f => f.id === id);
  if (!file) return;

  // Highlight sidebar item
  document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
  const fi = document.getElementById(`fi-${id}`);
  if (fi) fi.classList.add('active');

  // Show editor
  showEditor();
  
  // Close sidebar on mobile
  closeSidebarOnMobile();

  // Set title (display name only, without ID)
  const displayName = extractDisplayName(file.name);
  document.getElementById('fileTitleInput').value = displayName;
  document.getElementById('filePath').textContent = `Markpad / ${displayName}.md`;

  // Load content from Drive
  setLoading(true);
  try {
    const res = await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`
    );
    const content = await res.text();
    activeFileContent = content;
    setEditorContent(content);
    updateStats();
    setSaved();
    document.getElementById('saveBtn').style.display = 'flex';
    updateMobileSaveButton(true);
    
    // Load people for this note
    const fileId = extractFileId(file.name);
    if (fileId) {
      selectedPeople = await getPeopleForNote(fileId);
      renderPeopleChips();
      selectedTags = await getTagsForNote(fileId);
      renderTagsChips();
    } else {
      selectedPeople = [];
      renderPeopleChips();
      selectedTags = [];
      renderTagsChips();
    }
  } catch(e) {
    if (e.message !== 'Unauthorized') showToast('Could not load file content', true);
  }
  setLoading(false);
}

async function saveFile() {
  if (!activeFileId) return;
  const md = getCurrentMarkdown();
  const titleVal = document.getElementById('fileTitleInput').value.trim() || 'untitled';
  
  // Get current file to extract its ID
  const file = files.find(f => f.id === activeFileId);
  if (!file) return;
  
  // Extract existing ID from filename, or generate new one if missing
  let fileId = extractFileId(file.name);
  if (!fileId) {
    fileId = generateFileId();
  }
  
  // Build new filename with ID preserved
  const newName = buildFilename(titleVal, fileId);

  setSaving(true);

  try {
    // Update content (media upload)
    await driveRequest(
      `https://www.googleapis.com/upload/drive/v3/files/${activeFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: md
      }
    );

    // Update name if changed
    if (file.name !== newName) {
      await driveRequest(
        `https://www.googleapis.com/drive/v3/files/${activeFileId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        }
      );
      file.name = newName;
      file.modifiedTime = new Date().toISOString();
      renderFileList(files);
      document.getElementById(`fi-${activeFileId}`)?.classList.add('active');
    }

    activeFileContent = md;
    isDirty = false;
    setSaved();
    showToast('✓ Saved');
    
    // Update note in spreadsheet index
    const peopleIds = selectedPeople.map(p => p.person_id);
    await updateNoteInSheet(fileId, titleVal, peopleIds, selectedTags);
  } catch(e) {
    console.error('Save error:', e);
    if (e.message === 'Unauthorized') {
      // Already handled by driveRequest
    } else {
      showToast('Save failed — check your connection', true);
    }
  }

  setSaving(false);
}

async function createNewFile() {
  const rawName = document.getElementById('newFileName').value.trim() || 'untitled';
  
  // Generate unique ID for the file
  const fileId = generateFileId();
  const name = buildFilename(rawName, fileId);
  
  closeModal('newModal');

  const initialContent = `# ${rawName}\n\nStart writing here…`;

  try {
    // Ensure we have the Markpad folder
    if (!markpadFolderId) {
      await ensureMarkpadFolder();
    }
    
    // Multipart upload: metadata + content
    const boundary = 'markpad_boundary_' + Date.now();
    const metadata = JSON.stringify({ 
      name, 
      mimeType: 'text/plain',
      parents: [markpadFolderId]
    });

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
      `${initialContent}\r\n` +
      `--${boundary}--`;

    const res = await driveRequest(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body
      }
    );

    const newFile = await res.json();
    newFile.size = initialContent.length.toString();
    files.unshift(newFile);
    renderFileList(files);
    showToast(`📄 Created ${rawName}.md`);
    
    // Add note to spreadsheet index
    console.log('🔄 About to add note to sheet with ID:', fileId, 'and title:', rawName);
    const peopleIds = selectedPeople.map(p => p.person_id);
    await addNoteToSheet(fileId, rawName, peopleIds, selectedTags);
    console.log('✅ Note sheet operation completed');
    
    await selectFile(newFile.id);
  } catch(e) {
    console.error('Error in createNewFile:', e);
    if (e.message !== 'Unauthorized') showToast('Could not create file', true);
  }
}

async function confirmDelete() {
  closeModal('deleteModal');
  if (!deleteTargetId) return;

  try {
    await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${deleteTargetId}`,
      { method: 'DELETE' }
    );
    files = files.filter(f => f.id !== deleteTargetId);
    renderFileList(files);
    showToast('Note deleted');
    if (activeFileId === deleteTargetId) {
      resetEditor();
    }
  } catch(e) {
    if (e.message !== 'Unauthorized') showToast('Could not delete file', true);
  }

  deleteTargetId = null;
}
