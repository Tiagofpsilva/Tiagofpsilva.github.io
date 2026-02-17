// ═══════════════════════════════════════════════════════════════
// APPLICATION STATE
// ═══════════════════════════════════════════════════════════════

let accessToken = null;
let currentUser = null;
let files = [];            // [{id, name, modifiedTime, size}]
let activeFileId = null;
let activeFileContent = '';// raw markdown source of truth
let currentMode = 'wysiwyg';
let isDirty = false;
let saveTimer = null;
let ctxTargetId = null;
let deleteTargetId = null;
let tokenClient = null;
let markpadFolderId = '1j5WilqvRvZ2umB8hJmQvo3FWVXMnkBV4'; // Google Drive folder ID for Markpad folder

// People management
let selectedPeople = [];   // Array of {person_id, name} objects for the current note
let allPeople = [];        // Cached list of all people from spreadsheet

// Tags management
let selectedTags = [];     // Array of tag names for the current note
let allTags = [];          // Cached list of all tags from spreadsheet
