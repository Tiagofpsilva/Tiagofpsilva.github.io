// ═══════════════════════════════════════════════════════════════
// MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function openNewModal() {
  // Clear selected people and tags for new note
  selectedPeople = [];
  renderPeopleChips();
  selectedTags = [];
  renderTagsChips();
  
  document.getElementById('newModal').classList.add('open');
  document.getElementById('newFileName').value = '';
  document.getElementById('newFileNamePreview').textContent = 'untitled';
  setTimeout(() => document.getElementById('newFileName').focus(), 50);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

function updateNewFilePreview() {
  const val = document.getElementById('newFileName').value || 'untitled';
  document.getElementById('newFileNamePreview').textContent = val.replace(/\.md$/i,'');
}

// Initialize modal overlay click handlers
function initModalHandlers() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAllModals();
    });
  });
}
