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
