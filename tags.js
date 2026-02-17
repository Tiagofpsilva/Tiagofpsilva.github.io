// ═══════════════════════════════════════════════════════════════
// TAGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function renderTagsChips() {
  const container = document.getElementById('tagsChips');
  if (!container) return;
  
  container.innerHTML = selectedTags.map(tag => `
    <div class="tag-chip">
      <span>${tag}</span>
      <span class="tag-chip-remove" onclick="removeTag('${tag.replace(/'/g, "\\\'")}')" onmousedown="event.preventDefault()">×</span>
    </div>
  `).join('');
}

function removeTag(tagName) {
  selectedTags = selectedTags.filter(t => t !== tagName);
  renderTagsChips();
  markDirty();
}

async function onTagsInputChange() {
  const input = document.getElementById('tagsInput');
  const query = input.value.toLowerCase().trim();
  
  if (!query) {
    document.getElementById('tagsDropdown').innerHTML = '';
    document.getElementById('tagsDropdown').classList.remove('open');
    return;
  }
  
  // Fetch tags if not cached
  if (allTags.length === 0) {
    allTags = await fetchAllTags();
  }
  
  // Filter tags by query, excluding already selected
  const filtered = allTags.filter(t => 
    !selectedTags.includes(t) && 
    t.toLowerCase().includes(query)
  );
  
  renderTagsDropdown(filtered, query);
}

function renderTagsDropdown(tags, query) {
  const dropdown = document.getElementById('tagsDropdown');
  
  if (tags.length === 0) {
    dropdown.innerHTML = `<div class="tags-dropdown-item" onmousedown="addNewTag('${query}')">
      + Create "${query}"
    </div>`;
  } else {
    dropdown.innerHTML = tags.map(t => `
      <div class="tags-dropdown-item" onmousedown="selectTag('${t.replace(/'/g, "\\'")}')">
        ${t}
      </div>
    `).join('');
    
    // Add option to create new at the end
    dropdown.innerHTML += `<div class="tags-dropdown-item" onmousedown="addNewTag('${query}')">
      + Create "${query}"
    </div>`;
  }
  
  dropdown.classList.add('open');
}

function selectTag(tagName) {
  // Check if already selected
  if (selectedTags.includes(tagName)) return;
  
  selectedTags.push(tagName);
  renderTagsChips();
  document.getElementById('tagsInput').value = '';
  document.getElementById('tagsDropdown').classList.remove('open');
  markDirty();
}

async function addNewTag(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return;
  
  try {
    const newTag = await findOrCreateTag(trimmedName);
    if (newTag && !selectedTags.includes(newTag)) {
      selectedTags.push(newTag);
      renderTagsChips();
      
      // Update allTags cache
      if (!allTags.includes(newTag)) {
        allTags.push(newTag);
      }
    }
    
    document.getElementById('tagsInput').value = '';
    document.getElementById('tagsDropdown').classList.remove('open');
    markDirty();
  } catch (e) {
    showToast('Could not add tag', true);
  }
}

function onTagsInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const input = document.getElementById('tagsInput');
    const query = input.value.trim();
    if (query) {
      addNewTag(query);
    }
  }
}

function showTagsDropdown() {
  const input = document.getElementById('tagsInput');
  if (input.value.trim()) {
    onTagsInputChange();
  }
}

let tagsDropdownHideTimeout;
function hideTagsDropdownDelayed() {
  tagsDropdownHideTimeout = setTimeout(() => {
    document.getElementById('tagsDropdown').classList.remove('open');
  }, 200);
}
