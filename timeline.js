// ═══════════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════════

let timelineSelectedPerson = null;
let timelineNotes = [];
let timelineAllPeople = [];

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
  timelineNotes = [];
  document.getElementById('timelineSearchInput').value = '';
  document.getElementById('timelineContent').innerHTML = `
    <div class="timeline-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <p>Search for a person to see their timeline</p>
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

async function onTimelineSearchChange() {
  const input = document.getElementById('timelineSearchInput');
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
    dropdown.innerHTML = `<div class="timeline-people-dropdown-item">No people found</div>`;
  } else {
    dropdown.innerHTML = people.map(p => `
      <div class="timeline-people-dropdown-item" onmousedown="selectTimelinePerson('${p.person_id}','${p.name.replace(/'/g, "\\'")}')">
        ${escHtml(p.name)}
      </div>
    `).join('');
  }
  
  dropdown.classList.add('open');
}

function showTimelineDropdown() {
  const input = document.getElementById('timelineSearchInput');
  if (input.value.trim()) {
    onTimelineSearchChange();
  }
}

let timelineDropdownHideTimeout;
function hideTimelineDropdownDelayed() {
  timelineDropdownHideTimeout = setTimeout(() => {
    document.getElementById('timelinePeopleDropdown').classList.remove('open');
  }, 200);
}

// ───────────────────────────────────────────────────────────────
// PERSON SELECTION & TIMELINE RENDERING
// ───────────────────────────────────────────────────────────────

async function selectTimelinePerson(personId, personName) {
  timelineSelectedPerson = { person_id: personId, name: personName };
  
  // Update search input
  document.getElementById('timelineSearchInput').value = personName;
  document.getElementById('timelinePeopleDropdown').classList.remove('open');
  
  // Show loading state
  document.getElementById('timelineContent').innerHTML = `
    <div class="timeline-empty">
      <div class="spinner" style="width:32px;height:32px;border-width:3px"></div>
      <p>Loading timeline...</p>
    </div>
  `;
  
  try {
    // Fetch notes for this person
    await loadTimelineNotes(personId);
    
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

async function loadTimelineNotes(personId) {
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
  
  // Filter notes that mention this person
  timelineNotes = rows
    .filter(row => {
      const peopleColumn = row[4] || ''; // Column E (index 4) is "people"
      const peopleIds = peopleColumn.split(',').map(id => id.trim());
      return peopleIds.includes(personId);
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
  
  if (timelineNotes.length === 0) {
    content.innerHTML = `
      <div class="timeline-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>No notes found for ${escHtml(timelineSelectedPerson.name)}</p>
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
    
    const peopleHtml = peopleNames.length > 0
      ? `<div class="timeline-people">${peopleNames.map(name => escHtml(name)).join(', ')}</div>`
      : '';
    
    return `
      <div class="timeline-item">
        <div class="timeline-first-line">
          <span class="timeline-date">${formatTimelineDate(note.updatedAt)}</span>
          <span class="timeline-title" onclick="openNoteFromTimeline('${note.id}')">${escHtml(note.title)}</span>
        </div>
        ${peopleHtml}
      </div>
    `;
  }).join('');
  
  content.innerHTML = `
    <div class="timeline-container">
      <div class="timeline-person-name">${escHtml(timelineSelectedPerson.name)}</div>
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
