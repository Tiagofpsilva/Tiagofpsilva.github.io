// ═══════════════════════════════════════════════════════════════
// PEOPLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function renderPeopleChips() {
  const container = document.getElementById('peopleChips');
  if (!container) return;
  
  container.innerHTML = selectedPeople.map(person => `
    <div class="person-chip">
      <span>${person.name}</span>
      <span class="person-chip-remove" onclick="removePerson('${person.person_id}')" onmousedown="event.preventDefault()">×</span>
    </div>
  `).join('');
}

function removePerson(personId) {
  selectedPeople = selectedPeople.filter(p => p.person_id !== personId);
  renderPeopleChips();
  markDirty();
}

async function onPeopleInputChange() {
  const input = document.getElementById('peopleInput');
  const query = input.value.toLowerCase().trim();
  
  if (!query) {
    document.getElementById('peopleDropdown').innerHTML = '';
    document.getElementById('peopleDropdown').classList.remove('open');
    return;
  }
  
  // Fetch people if not cached
  if (allPeople.length === 0) {
    allPeople = await fetchAllPeople();
  }
  
  // Filter people by query, excluding already selected
  const selectedIds = selectedPeople.map(p => p.person_id);
  const filtered = allPeople.filter(p => 
    !selectedIds.includes(p.person_id) && 
    p.name.toLowerCase().includes(query)
  );
  
  renderPeopleDropdown(filtered, query);
}

function renderPeopleDropdown(people, query) {
  const dropdown = document.getElementById('peopleDropdown');
  
  if (people.length === 0) {
    dropdown.innerHTML = `<div class="people-dropdown-item" onmousedown="addNewPerson('${query}')">
      + Create "${query}"
    </div>`;
  } else {
    dropdown.innerHTML = people.map(p => `
      <div class="people-dropdown-item" onmousedown="selectPerson('${p.person_id}','${p.name.replace(/'/g, "\\'")}')">
        ${p.name}
      </div>
    `).join('');
    
    // Add option to create new at the end
    dropdown.innerHTML += `<div class="people-dropdown-item" onmousedown="addNewPerson('${query}')">
      + Create "${query}"
    </div>`;
  }
  
  dropdown.classList.add('open');
}

function selectPerson(personId, personName) {
  // Check if already selected
  if (selectedPeople.some(p => p.person_id === personId)) return;
  
  selectedPeople.push({ person_id: personId, name: personName });
  renderPeopleChips();
  document.getElementById('peopleInput').value = '';
  document.getElementById('peopleDropdown').classList.remove('open');
  markDirty();
}

async function addNewPerson(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return;
  
  try {
    const newPerson = await findOrCreatePerson(trimmedName);
    if (newPerson && !selectedPeople.some(p => p.person_id === newPerson.person_id)) {
      selectedPeople.push(newPerson);
      renderPeopleChips();
      
      // Update allPeople cache
      if (!allPeople.some(p => p.person_id === newPerson.person_id)) {
        allPeople.push(newPerson);
      }
    }
    
    document.getElementById('peopleInput').value = '';
    document.getElementById('peopleDropdown').classList.remove('open');
    markDirty();
  } catch (e) {
    showToast('Could not add person', true);
  }
}

function onPeopleInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const input = document.getElementById('peopleInput');
    const query = input.value.trim();
    if (query) {
      addNewPerson(query);
    }
  }
}

function showPeopleDropdown() {
  const input = document.getElementById('peopleInput');
  if (input.value.trim()) {
    onPeopleInputChange();
  }
}

let dropdownHideTimeout;
function hidePeopleDropdownDelayed() {
  dropdownHideTimeout = setTimeout(() => {
    document.getElementById('peopleDropdown').classList.remove('open');
  }, 200);
}
