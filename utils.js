// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function generateFileId() {
  // Generate unique ID: timestamp + random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
}

function extractFileId(filename) {
  // Extract ID from filename format: "name_ID.md"
  const match = filename.match(/_([a-z0-9]+)\.md$/i);
  return match ? match[1] : null;
}

function extractDisplayName(filename) {
  // Extract display name without ID: "My Note_abc123.md" -> "My Note"
  const withoutExtension = filename.replace(/\.md$/i, '');
  const parts = withoutExtension.split('_');
  
  // If there's an ID at the end, remove it
  if (parts.length > 1 && /^[a-z0-9]+$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  
  return parts.join('_');
}

function buildFilename(displayName, fileId) {
  // Build filename: "My Note" + "abc123" -> "My Note_abc123.md"
  const cleanName = displayName.replace(/\.md$/i, '');
  return `${cleanName}_${fileId}.md`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function formatSize(bytes) {
  const b = parseInt(bytes);
  if (isNaN(b)) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
