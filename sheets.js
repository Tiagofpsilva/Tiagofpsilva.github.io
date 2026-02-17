// ═══════════════════════════════════════════════════════════════
// GOOGLE SHEETS INTEGRATION
// ═══════════════════════════════════════════════════════════════

let indexSpreadsheetId = '1NUnA-d9_ZjmiSwK3KtnY2FG-ItaPkagMiE6_Z-bmY9s';
let sheetInitialized = false;

// ───────────────────────────────────────────────────────────────
// ENSURE INDEX SPREADSHEET EXISTS
// ───────────────────────────────────────────────────────────────
async function ensureIndexSpreadsheet() {
  // If we have an ID and it's already initialized, return it
  if (indexSpreadsheetId && sheetInitialized) return indexSpreadsheetId;
  
  // If we have a hardcoded ID, verify it exists and initialize if needed
  if (indexSpreadsheetId) {
    try {
      // Check if the spreadsheet exists and has the notes sheet
      const sheetRes = await sheetsRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}?fields=sheets.properties`
      );
      const sheetData = await sheetRes.json();
      
      // Check if "notes", "people", and "tags" sheets exist
      const hasNotesSheet = sheetData.sheets?.some(s => s.properties.title === 'notes');
      const hasPeopleSheet = sheetData.sheets?.some(s => s.properties.title === 'people');
      const hasTagsSheet = sheetData.sheets?.some(s => s.properties.title === 'tags');
      
      const sheetsToAdd = [];
      if (!hasNotesSheet) {
        sheetsToAdd.push({
          addSheet: {
            properties: {
              title: 'notes',
              gridProperties: { rowCount: 1000, columnCount: 6 }
            }
          }
        });
      }
      if (!hasPeopleSheet) {
        sheetsToAdd.push({
          addSheet: {
            properties: {
              title: 'people',
              gridProperties: { rowCount: 1000, columnCount: 2 }
            }
          }
        });
      }
      if (!hasTagsSheet) {
        sheetsToAdd.push({
          addSheet: {
            properties: {
              title: 'tags',
              gridProperties: { rowCount: 1000, columnCount: 1 }
            }
          }
        });
      }
      
      if (sheetsToAdd.length > 0) {
        await sheetsRequest(
          `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}:batchUpdate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: sheetsToAdd })
          }
        );
      }
      
      // Initialize or verify header rows
      await sheetsRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            data: [
              {
                range: 'notes!A1:F1',
                values: [['id', 'title', 'createdAt', 'updatedAt', 'people', 'tags']]
              },
              {
                range: 'people!A1:B1',
                values: [['person_id', 'name']]
              },
              {
                range: 'tags!A1',
                values: [['name']]
              }
            ]
          })
        }
      );
      
      sheetInitialized = true;
      console.log('✓ Spreadsheet verified and initialized');
      return indexSpreadsheetId;
    } catch (e) {
      console.error('Failed to verify hardcoded spreadsheet ID:', e);
      // Fall through to search/create logic
      indexSpreadsheetId = null;
    }
  }

  // Search for the spreadsheet in the markpad folder
  try {
    const query = `name='index_markpad' and '${markpadFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
    const res = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
    );
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      // Spreadsheet exists
      indexSpreadsheetId = data.files[0].id;
      
      // Initialize header rows just in case
      await sheetsRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            data: [
              {
                range: 'notes!A1:F1',
                values: [['id', 'title', 'createdAt', 'updatedAt', 'people', 'tags']]
              },
              {
                range: 'people!A1:B1',
                values: [['person_id', 'name']]
              },
              {
                range: 'tags!A1',
                values: [['name']]
              }
            ]
          })
        }
      );
      
      sheetInitialized = true;
      return indexSpreadsheetId;
    }

    // Create spreadsheet if it doesn't exist
    const createRes = await driveRequest(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            title: 'index_markpad'
          },
          sheets: [
            {
              properties: {
                title: 'notes',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 6
                }
              }
            },
            {
              properties: {
                title: 'people',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 2
                }
              }
            },
            {
              properties: {
                title: 'tags',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 1
                }
              }
            }
          ]
        })
      }
    );

    const spreadsheet = await createRes.json();
    indexSpreadsheetId = spreadsheet.spreadsheetId;

    // Move spreadsheet to markpad folder
    await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${indexSpreadsheetId}?addParents=${markpadFolderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Initialize header rows
    await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data: [
            {
              range: 'notes!A1:F1',
              values: [['id', 'title', 'createdAt', 'updatedAt', 'people', 'tags']]
            },
            {
              range: 'people!A1:B1',
              values: [['person_id', 'name']]
            },
            {
              range: 'tags!A1',
              values: [['name']]
            }
          ]
        })
      }
    );

    sheetInitialized = true;
    showToast('📊 Created index spreadsheet');
    return indexSpreadsheetId;
  } catch (e) {
    console.error('Failed to ensure index spreadsheet:', e);
    if (e.message !== 'Unauthorized') {
      showToast('Could not access index spreadsheet', true);
    }
    throw e;
  }
}

// ───────────────────────────────────────────────────────────────
// SHEETS API REQUEST WRAPPER
// ───────────────────────────────────────────────────────────────
async function sheetsRequest(url, options = {}) {
  if (!accessToken) throw new Error('Not authenticated');

  console.log('📡 Sheets API request:', url);

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.error('❌ Unauthorized - need to re-authenticate');
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Sheets API error:', response.status, error);
    console.error('Request URL:', url);
    console.error('Request body:', options.body);
    throw new Error(`Sheets API error ${response.status}: ${error}`);
  }

  console.log('✓ Sheets API response OK');
  return response;
}

// ───────────────────────────────────────────────────────────────
// FIND ROW BY NOTE ID
// ───────────────────────────────────────────────────────────────
async function findNoteRowById(noteId) {
  try {
    await ensureIndexSpreadsheet();

    // Get all rows from the sheet
    const res = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!A:A`
    );
    const data = await res.json();

    if (!data.values) return null;

    // Find the row index where the id matches (skip header row)
    for (let i = 1; i < data.values.length; i++) {
      if (data.values[i][0] === noteId) {
        return i + 1; // Return 1-based row number
      }
    }

    return null;
  } catch (e) {
    console.error('Failed to find note row:', e);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// GET PEOPLE FOR A NOTE
// ───────────────────────────────────────────────────────────────
async function getPeopleForNote(noteId) {
  try {
    await ensureIndexSpreadsheet();

    const rowNumber = await findNoteRowById(noteId);
    if (!rowNumber) return [];

    // Get the people column (column E) for this row
    const res = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!E${rowNumber}`
    );
    const data = await res.json();

    if (!data.values || !data.values[0] || !data.values[0][0]) return [];

    // Parse comma-separated person IDs
    const peopleIds = data.values[0][0].split(',').map(id => id.trim()).filter(id => id);
    
    // Fetch all people to get names
    if (!cachedPeople || cachedPeople.length === 0) {
      await fetchAllPeople();
    }

    // Map IDs to person objects
    const people = peopleIds
      .map(id => cachedPeople.find(p => p.person_id === id))
      .filter(p => p); // Remove nulls

    console.log('✓ Got people for note:', noteId, people);
    return people;
  } catch (e) {
    console.error('Failed to get people for note:', e);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────
// GET TAGS FOR A NOTE
// ───────────────────────────────────────────────────────────────
async function getTagsForNote(noteId) {
  try {
    await ensureIndexSpreadsheet();

    const rowNumber = await findNoteRowById(noteId);
    if (!rowNumber) return [];

    // Get the tags column (column F) for this row
    const res = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!F${rowNumber}`
    );
    const data = await res.json();

    if (!data.values || !data.values[0] || !data.values[0][0]) return [];

    // Parse comma-separated tag names
    const tags = data.values[0][0].split(',').map(tag => tag.trim()).filter(tag => tag);

    console.log('✓ Got tags for note:', noteId, tags);
    return tags;
  } catch (e) {
    console.error('Failed to get tags for note:', e);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────
// ADD NEW NOTE TO SPREADSHEET
// ───────────────────────────────────────────────────────────────
async function addNoteToSheet(noteId, title, peopleIds = [], tags = []) {
  console.log('📝 Adding note to sheet:', noteId, title, peopleIds, tags);
  try {
    await ensureIndexSpreadsheet();
    console.log('✓ Spreadsheet ensured:', indexSpreadsheetId);

    const now = new Date().toISOString();
    const peopleStr = peopleIds.join(',');
    const tagsStr = tags.join(',');
    const values = [[noteId, title, now, now, peopleStr, tagsStr]];
    console.log('📊 Appending values:', values);

    const response = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      }
    );

    const result = await response.json();
    console.log('✓ Added note to spreadsheet:', noteId, title, result);
  } catch (e) {
    console.error('❌ Failed to add note to sheet:', e);
    console.error('Error details:', e.message, e.stack);
    showToast('⚠️ Could not add note to spreadsheet - check console', true);
    // Don't throw - this is a background operation
  }
}

// ───────────────────────────────────────────────────────────────
// UPDATE EXISTING NOTE IN SPREADSHEET
// ───────────────────────────────────────────────────────────────
async function updateNoteInSheet(noteId, newTitle, peopleIds = [], tags = []) {
  console.log('✏️ Updating note in sheet:', noteId, newTitle, peopleIds, tags);
  try {
    await ensureIndexSpreadsheet();
    console.log('✓ Spreadsheet ensured:', indexSpreadsheetId);

    const rowNumber = await findNoteRowById(noteId);
    console.log('📍 Row number found:', rowNumber);
    
    if (!rowNumber) {
      // Note not found in sheet, add it as new
      await addNoteToSheet(noteId, newTitle, peopleIds, tags);
      return;
    }

    // Get current row data to check if anything changed
    const getRes = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!A${rowNumber}:F${rowNumber}`
    );
    const getData = await getRes.json();
    
    if (!getData.values || !getData.values[0]) return;

    const currentTitle = getData.values[0][1];
    const currentPeople = getData.values[0][4] || '';
    const currentTags = getData.values[0][5] || '';
    const newPeopleStr = peopleIds.join(',');
    const newTagsStr = tags.join(',');
    
    // Update if title, people, or tags changed
    if (currentTitle !== newTitle || currentPeople !== newPeopleStr || currentTags !== newTagsStr) {
      const now = new Date().toISOString();
      const values = [[noteId, newTitle, getData.values[0][2], now, newPeopleStr, newTagsStr]]; // Preserve createdAt

      await sheetsRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!A${rowNumber}:F${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values })
        }
      );

      console.log('✓ Updated note in spreadsheet:', noteId, newTitle);
    } else {
      // Only update the updatedAt timestamp
      const now = new Date().toISOString();
      await sheetsRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/notes!D${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [[now]] })
        }
      );

      console.log('✓ Updated timestamp in spreadsheet:', noteId);
    }
  } catch (e) {
    console.error('Failed to update note in sheet:', e);
    // Don't throw - this is a background operation
  }
}

// ═══════════════════════════════════════════════════════════════
// PEOPLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let cachedPeople = null;

// ───────────────────────────────────────────────────────────────
// FETCH ALL PEOPLE
// ───────────────────────────────────────────────────────────────
async function fetchAllPeople() {
  try {
    await ensureIndexSpreadsheet();

    const res = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/people!A2:B`
    );
    const data = await res.json();

    if (!data.values) {
      cachedPeople = [];
      return [];
    }

    cachedPeople = data.values.map(row => ({
      person_id: row[0],
      name: row[1] || ''
    }));

    console.log('✓ Fetched people:', cachedPeople.length);
    return cachedPeople;
  } catch (e) {
    console.error('Failed to fetch people:', e);
    return cachedPeople || [];
  }
}

// ───────────────────────────────────────────────────────────────
// ADD NEW PERSON
// ───────────────────────────────────────────────────────────────
async function addPersonToSheet(name) {
  try {
    await ensureIndexSpreadsheet();

    // Generate unique person ID
    const person_id = 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const values = [[person_id, name]];

    await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/people:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      }
    );

    console.log('✓ Added person to spreadsheet:', person_id, name);
    
    // Update cache
    if (cachedPeople) {
      cachedPeople.push({ person_id, name });
    }

    return { person_id, name };
  } catch (e) {
    console.error('Failed to add person to sheet:', e);
    throw e;
  }
}

// ───────────────────────────────────────────────────────────────
// FIND OR CREATE PERSON
// ───────────────────────────────────────────────────────────────
async function findOrCreatePerson(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  // Check cache first
  if (!cachedPeople) {
    await fetchAllPeople();
  }

  // Find existing person (case-insensitive)
  const existing = cachedPeople.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
  if (existing) {
    return existing;
  }

  // Create new person
  return await addPersonToSheet(trimmedName);
}

// ═══════════════════════════════════════════════════════════════
// TAGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let cachedTags = null;

// ───────────────────────────────────────────────────────────────
// FETCH ALL TAGS
// ───────────────────────────────────────────────────────────────
async function fetchAllTags() {
  try {
    await ensureIndexSpreadsheet();

    const res = await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/tags!A2:A`
    );
    const data = await res.json();

    if (!data.values) {
      cachedTags = [];
      return [];
    }

    cachedTags = data.values.map(row => row[0] || '').filter(name => name);

    console.log('✓ Fetched tags:', cachedTags.length);
    return cachedTags;
  } catch (e) {
    console.error('Failed to fetch tags:', e);
    return cachedTags || [];
  }
}

// ───────────────────────────────────────────────────────────────
// ADD NEW TAG
// ───────────────────────────────────────────────────────────────
async function addTagToSheet(name) {
  try {
    await ensureIndexSpreadsheet();

    const values = [[name]];

    await sheetsRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${indexSpreadsheetId}/values/tags:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      }
    );

    console.log('✓ Added tag to spreadsheet:', name);
    
    // Update cache
    if (cachedTags) {
      cachedTags.push(name);
    }

    return name;
  } catch (e) {
    console.error('Failed to add tag to sheet:', e);
    throw e;
  }
}

// ───────────────────────────────────────────────────────────────
// FIND OR CREATE TAG
// ───────────────────────────────────────────────────────────────
async function findOrCreateTag(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  // Check cache first
  if (!cachedTags) {
    await fetchAllTags();
  }

  // Find existing tag (case-insensitive)
  const existing = cachedTags.find(t => t.toLowerCase() === trimmedName.toLowerCase());
  if (existing) {
    return existing;
  }

  // Create new tag
  return await addTagToSheet(trimmedName);
}
