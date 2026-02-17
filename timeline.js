// ═══════════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════════

let timelineSelectedPerson = null;
let timelineSelectedTag = null;
let timelineNotes = [];
let timelineAllPeople = [];
let timelineAllTags = [];
let timelineFilterMode = 'AND'; // 'AND' or 'OR'

// ───────────────────────────────────────────────────────────────
// NAVIGATION
// ───────────────────────────────────────────────────────────────

function showTimelineView() {
  // Hide editor and empty state
  document.getElementById('editorWrapper').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  
  // Show timeline view
  const timelineView = document.getElementById('timelineView');
  timelineView.style.display = 'flex';
  
  // Close sidebar on mobile
  closeSidebarOnMobile();
  
  // Reset timeline
  timelineSelectedPerson = null;
  timelineSelectedTag = null;
  timelineNotes = [];
  timelineFilterMode = 'AND';
  document.getElementById('timelinePersonInput').value = '';
  document.getElementById('timelineTagInput').value = '';
  updateTimelineFilterButton();
  updateTimelineSelectedFilters();
  document.getElementById('timelineContent').innerHTML = `
    <div class="timeline-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <p>Search for a person or tag to see their timeline</p>
    </div>
  `;
}

function hideTimelineView() {
  // Hide timeline view
  document.getElementById('timelineView').style.display = 'none';
  
  // Show empty state (user can then select a note)
  document.getElementById('emptyState').style.display = 'flex';
  
  // Close sidebar on mobile
  closeSidebarOnMobile();
}

// ───────────────────────────────────────────────────────────────
// PEOPLE SEARCH
// ───────────────────────────────────────────────────────────────

async function onTimelinePersonSearchChange() {
  const input = document.getElementById('timelinePersonInput');
  const query = input.value.toLowerCase().trim();
  
  if (!query) {
    document.getElementById('timelinePeopleDropdown').innerHTML = '';
    document.getElementById('timelinePeopleDropdown').classList.remove('open');
    return;
  }
  
  // Fetch people if not cached
  if (timelineAllPeople.length === 0) {
    timelineAllPeople = await fetchAllPeople();
  }
  
  // Filter people by query
  const filtered = timelineAllPeople.filter(p => 
    p.name.toLowerCase().includes(query)
  );
  
  renderTimelinePeopleDropdown(filtered);
}

function renderTimelinePeopleDropdown(people) {
  const dropdown = document.getElementById('timelinePeopleDropdown');
  
  if (people.length === 0) {
    dropdown.innerHTML = `<div class="timeline-dropdown-item">No people found</div>`;
  } else {
    dropdown.innerHTML = people.map(p => `
      <div class="timeline-dropdown-item" onmousedown="selectTimelinePerson('${p.person_id}','${p.name.replace(/'/g, "\\'")}')">
        ${escHtml(p.name)}
      </div>
    `).join('');
  }
  
  dropdown.classList.add('open');
}

function showTimelinePeopleDropdown() {
  const input = document.getElementById('timelinePersonInput');
  if (input.value.trim()) {
    onTimelinePersonSearchChange();
  }
}

function hideTimelinePeopleDropdownDelayed() {
  setTimeout(() => {
    document.getElementById('timelinePeopleDropdown').classList.remove('open');
  }, 200);
}

// ───────────────────────────────────────────────────────────────
// TAGS SEARCH
// ───────────────────────────────────────────────────────────────

async function onTimelineTagSearchChange() {
  const input = document.getElementById('timelineTagInput');
  const query = input.value.toLowerCase().trim();
  
  if (!query) {
    document.getElementById('timelineTagsDropdown').innerHTML = '';
    document.getElementById('timelineTagsDropdown').classList.remove('open');
    return;
  }
  
  // Fetch tags if not cached
  if (timelineAllTags.length === 0) {
    timelineAllTags = await fetchAllTags();
  }
  
  // Filter tags by query
  const filtered = timelineAllTags.filter(t => 
    t.toLowerCase().includes(query)
  );
  
  renderTimelineTagsDropdown(filtered);
}

function renderTimelineTagsDropdown(tags) {
  const dropdown = document.getElementById('timelineTagsDropdown');
  
  if (tags.length === 0) {
    dropdown.innerHTML = `<div class="timeline-dropdown-item">No tags found</div>`;
  } else {
    dropdown.innerHTML = tags.map(t => `
      <div class="timeline-dropdown-item" onmousedown="selectTimelineTag('${t.replace(/'/g, "\\'")}')">
        #${escHtml(t)}
      </div>
    `).join('');
  }
  
  dropdown.classList.add('open');
}

function showTimelineTagsDropdown() {
  const input = document.getElementById('timelineTagInput');
  if (input.value.trim()) {
    onTimelineTagSearchChange();
  }
}

function hideTimelineTagsDropdownDelayed() {
  setTimeout(() => {
    document.getElementById('timelineTagsDropdown').classList.remove('open');
  }, 200);
}

// ───────────────────────────────────────────────────────────────
// FILTER SELECTION & MANAGEMENT
// ───────────────────────────────────────────────────────────────

async function selectTimelinePerson(personId, personName) {
  timelineSelectedPerson = { person_id: personId, name: personName };
  
  // Clear search input
  document.getElementById('timelinePersonInput').value = '';
  document.getElementById('timelinePeopleDropdown').classList.remove('open');
  
  // Update selected filters display
  updateTimelineSelectedFilters();
  
  // Load and render timeline
  await loadAndRenderTimeline();
}

async function selectTimelineTag(tagName) {
  timelineSelectedTag = tagName;
  
  // Clear search input
  document.getElementById('timelineTagInput').value = '';
  document.getElementById('timelineTagsDropdown').classList.remove('open');
  
  // Update selected filters display
  updateTimelineSelectedFilters();
  
  // Load and render timeline
  await loadAndRenderTimeline();
}

function clearTimelinePerson() {
  timelineSelectedPerson = null;
  updateTimelineSelectedFilters();
  
  // Reload timeline if we still have a tag selected
  if (timelineSelectedTag) {
    loadAndRenderTimeline();
  } else {
    // Show empty state
    document.getElementById('timelineContent').innerHTML = `
      <div class="timeline-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p>Search for a person or tag to see their timeline</p>
      </div>
    `;
  }
}

function clearTimelineTag() {
  timelineSelectedTag = null;
  updateTimelineSelectedFilters();
  
  // Reload timeline if we still have a person selected
  if (timelineSelectedPerson) {
    loadAndRenderTimeline();
  } else {
    // Show empty state
    document.getElementById('timelineContent').innerHTML = `
      <div class="timeline-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p>Search for a person or tag to see their timeline</p>
      </div>
    `;
  }
}

function toggleTimelineFilterMode() {
  timelineFilterMode = timelineFilterMode === 'AND' ? 'OR' : 'AND';
  updateTimelineFilterButton();
  
  // Reload timeline if we have both filters selected
  if (timelineSelectedPerson && timelineSelectedTag) {
    loadAndRenderTimeline();
  }
}

function updateTimelineFilterButton() {
  const button = document.getElementById('timelineFilterModeBtn');
  if (button) {
    button.textContent = timelineFilterMode;
    button.title = timelineFilterMode === 'AND' ? 'Show notes matching both filters' : 'Show notes matching either filter';
  }
}

function updateTimelineSelectedFilters() {
  const container = document.getElementById('timelineSelectedFilters');
  if (!container) return;
  
  const filters = [];
  
  if (timelineSelectedPerson) {
    filters.push(`
      <div class="timeline-selected-filter">
        <span>${escHtml(timelineSelectedPerson.name)}</span>
        <button class="timeline-filter-clear" onclick="clearTimelinePerson()" title="Clear person filter">×</button>
      </div>
    `);
  }
  
  if (timelineSelectedTag) {
    filters.push(`
      <div class="timeline-selected-filter timeline-selected-tag">
        <span>#${escHtml(timelineSelectedTag)}</span>
        <button class="timeline-filter-clear" onclick="clearTimelineTag()" title="Clear tag filter">×</button>
      </div>
    `);
  }
  
  if (filters.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
  } else {
    container.innerHTML = filters.join('');
    container.style.display = 'flex';
  }
  
  // Show/hide filter mode button (only visible when both filters are active)
  const filterModeBtn = document.getElementById('timelineFilterModeBtn');
  if (filterModeBtn) {
    filterModeBtn.style.display = (timelineSelectedPerson && timelineSelectedTag) ? 'inline-block' : 'none';
  }
}

// ───────────────────────────────────────────────────────────────
// TIMELINE LOADING & RENDERING
// ───────────────────────────────────────────────────────────────

async function loadAndRenderTimeline() {
  // Show loading state
  document.getElementById('timelineContent').innerHTML = `
    <div class="timeline-empty">
      <div class="spinner" style="width:32px;height:32px;border-width:3px"></div>
      <p>Loading timeline...</p>
    </div>
  `;
  
  try {
    // Fetch notes based on selected filters
    await loadTimelineNotes();
    
    // Render timeline
    renderTimeline();
  } catch (error) {
    console.error('Error loading timeline:', error);
    document.getElementById('timelineContent').innerHTML = `
      <div class="timeline-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Error loading timeline</p>
      </div>
    `;
  }
}

async function loadTimelineNotes() {
  // Ensure spreadsheet exists
  await ensureIndexSpreadsheet();
  
  // Fetch all notes from the spreadsheet
  const notesRes = await sheetsRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!A2:F?majorDimension=ROWS`
  );
  
  if (!notesRes.ok) {
    throw new Error('Failed to fetch notes');
  }
  
  const data = await notesRes.json();
  const rows = data.values || [];
  
  // Filter notes based on selected person and/or tag
  timelineNotes = rows
    .filter(row => {
      const peopleColumn = row[4] || ''; // Column E (index 4) is "people"
      const tagsColumn = row[5] || ''; // Column F (index 5) is "tags"
      
      const peopleIds = peopleColumn.split(',').map(id => id.trim()).filter(id => id);
      const noteTags = tagsColumn.split(',').map(t => t.trim()).filter(t => t);
      
      const matchesPerson = !timelineSelectedPerson || peopleIds.includes(timelineSelectedPerson.person_id);
      const matchesTag = !timelineSelectedTag || noteTags.includes(timelineSelectedTag);
      
      // Apply AND/OR logic
      if (timelineSelectedPerson && timelineSelectedTag) {
        return timelineFilterMode === 'AND' ? (matchesPerson && matchesTag) : (matchesPerson || matchesTag);
      } else if (timelineSelectedPerson) {
        return matchesPerson;
      } else if (timelineSelectedTag) {
        return matchesTag;
      }
      
      return false;
    })
    .map(row => ({
      id: row[0] || '',
      title: row[1] || 'Untitled',
      createdAt: row[2] || '',
      updatedAt: row[3] || '',
      people: row[4] || '',
      tags: row[5] || ''
    }))
    .sort((a, b) => {
      // Sort by updatedAt, newest first
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB - dateA;
    });
}

function renderTimeline() {
  const content = document.getElementById('timelineContent');
  
  // Generate header text based on selected filters
  let headerText = 'Timeline';
  if (timelineSelectedPerson && timelineSelectedTag) {
    headerText = timelineFilterMode === 'AND' 
      ? `${timelineSelectedPerson.name} + #${timelineSelectedTag}` 
      : `${timelineSelectedPerson.name} or #${timelineSelectedTag}`;
  } else if (timelineSelectedPerson) {
    headerText = timelineSelectedPerson.name;
  } else if (timelineSelectedTag) {
    headerText = `#${timelineSelectedTag}`;
  }
  
  if (timelineNotes.length === 0) {
    content.innerHTML = `
      <div class="timeline-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>No notes found for ${escHtml(headerText)}</p>
      </div>
    `;
    return;
  }
  
  const timelineItems = timelineNotes.map(note => {
    // Get people names from IDs
    const peopleIds = note.people ? note.people.split(',').map(id => id.trim()).filter(id => id) : [];
    const peopleNames = peopleIds.map(id => {
      const person = timelineAllPeople.find(p => p.person_id === id);
      return person ? person.name : null;
    }).filter(name => name);
    
    // Get tags
    const noteTags = note.tags ? note.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    
    // Build metadata HTML (people and tags)
    const metadataParts = [];
    if (peopleNames.length > 0) {
      metadataParts.push(`<span class="timeline-people-list">${peopleNames.map(name => escHtml(name)).join(', ')}</span>`);
    }
    if (noteTags.length > 0) {
      metadataParts.push(`<span class="timeline-tags-list">${noteTags.map(tag => '#' + escHtml(tag)).join(' ')}</span>`);
    }
    
    const metadataHtml = metadataParts.length > 0
      ? `<div class="timeline-metadata">${metadataParts.join('<span class="timeline-separator">•</span>')}</div>`
      : '';
    
    return `
      <div class="timeline-item">
        <div class="timeline-first-line">
          <span class="timeline-date">${formatTimelineDate(note.updatedAt)}</span>
          <span class="timeline-title" onclick="openNoteFromTimeline('${note.id}')">${escHtml(note.title)}</span>
        </div>
        ${metadataHtml}
      </div>
    `;
  }).join('');
  
  content.innerHTML = `
    <div class="timeline-container">
      <div class="timeline-header-name">${escHtml(headerText)}</div>
      <div class="timeline-list">
        ${timelineItems}
      </div>
    </div>
  `;
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

async function openNoteFromTimeline(noteId) {
  // Hide timeline view
  hideTimelineView();
  
  // Ensure files are loaded
  if (files.length === 0) {
    showToast('Loading files...', false);
    await loadFiles();
  }
  
  // Find the file by matching the custom file ID in the filename
  // noteId is the custom ID (e.g., "abc123" from spreadsheet)
  // We need to find the file where extractFileId(filename) matches noteId
  let file = files.find(f => extractFileId(f.name) === noteId);
  
  // If not found, try refreshing the files list
  if (!file) {
    await loadFiles();
    file = files.find(f => extractFileId(f.name) === noteId);
  }
  
  if (file) {
    // Select the file using its Google Drive ID (this will load it in the editor)
    await selectFile(file.id);
  } else {
    showToast('Note not found. It may have been deleted.', true);
  }
}
