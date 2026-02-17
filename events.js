// ═══════════════════════════════════════════════════════════════
// GLOBAL EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function initEventHandlers() {
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Save file: Ctrl/Cmd + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (activeFileId) saveFile();
    }
    
    // New file: Ctrl/Cmd + N
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      if (accessToken) openNewModal();
    }
    
    // Escape key: close modals and context menu
    if (e.key === 'Escape') {
      hideContextMenu();
      closeAllModals();
    }
  });
  
  // Initialize modal handlers
  initModalHandlers();
  
  // Initialize context menu handlers
  initContextMenuHandlers();
}
