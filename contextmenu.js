// ═══════════════════════════════════════════════════════════════
// CONTEXT MENU
// ═══════════════════════════════════════════════════════════════

function showContextMenu(e, fileId) {
  e.preventDefault();
  ctxTargetId = fileId;
  const menu = document.getElementById('contextMenu');
  menu.style.display = 'block';
  menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - 100) + 'px';
}

function hideContextMenu() {
  document.getElementById('contextMenu').style.display = 'none';
}

async function ctxRename() {
  hideContextMenu();
  await selectFile(ctxTargetId);
  const titleInput = document.getElementById('fileTitleInput');
  titleInput.focus();
  titleInput.select();
}

function ctxDelete() {
  deleteTargetId = ctxTargetId;
  const file = files.find(f => f.id === deleteTargetId);
  const displayName = file ? extractDisplayName(file.name) : '';
  document.getElementById('deleteModalMsg').textContent =
    `"${displayName}.md" will be permanently deleted.`;
  hideContextMenu();
  document.getElementById('deleteModal').classList.add('open');
}

// Initialize context menu click handler
function initContextMenuHandlers() {
  document.addEventListener('click', hideContextMenu);
}
