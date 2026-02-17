// ═══════════════════════════════════════════════════════════════
// EDITOR LOGIC
// ═══════════════════════════════════════════════════════════════

function getCurrentMarkdown() {
  if (currentMode === 'raw') {
    return document.getElementById('rawEditor').value;
  }
  // Convert WYSIWYG html back to markdown (best-effort)
  return htmlToMarkdown(document.getElementById('wysiwygEditor').innerHTML);
}

function htmlToMarkdown(html) {
  // Basic HTML to Markdown converter
  let md = html;
  
  // Remove contenteditable artifacts
  md = md.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  
  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');
  
  // Bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');
  
  // Strikethrough
  md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~');
  md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
  
  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n');
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');
  
  // Blockquote
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, content) => {
    return content.split('\n').map(line => '> ' + line).join('\n') + '\n';
  });
  
  // Lists
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  });
  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
  });
  
  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Horizontal rule
  md = md.replace(/<hr[^>]*>/gi, '\n---\n');
  
  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  const txt = document.createElement('textarea');
  txt.innerHTML = md;
  md = txt.value;
  
  // Clean up multiple newlines
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();
  
  return md;
}

function setEditorContent(md) {
  document.getElementById('rawEditor').value = md;
  document.getElementById('wysiwygEditor').innerHTML = marked.parse(md);
}

function execFmt(cmd, arg) {
  if (currentMode === 'raw') return;
  document.getElementById('wysiwygEditor').focus();
  document.execCommand(cmd, false, arg || null);
  onEditorChange();
}

function onEditorChange() {
  // Sync wysiwyg → raw in the background
  const wysiwygContent = document.getElementById('wysiwygEditor').innerHTML;
  const markdownContent = htmlToMarkdown(wysiwygContent);
  document.getElementById('rawEditor').value = markdownContent;
  
  updateStats();
  markDirty();
}

function onRawChange() {
  const md = document.getElementById('rawEditor').value;
  // Update wysiwyg live preview
  document.getElementById('wysiwygEditor').innerHTML = marked.parse(md);
  updateStats();
  markDirty();
}

function onTitleChange() {
  markDirty();
  const name = document.getElementById('fileTitleInput').value || 'untitled';
  document.getElementById('filePath').textContent = `Markpad / ${name}.md`;
}

function setMode(mode) {
  currentMode = mode;
  const wysiwyg = document.getElementById('wysiwygEditor');
  const raw = document.getElementById('rawEditor');

  if (mode === 'wysiwyg') {
    // Render markdown → html
    wysiwyg.innerHTML = marked.parse(raw.value);
    wysiwyg.classList.remove('hidden');
    raw.classList.remove('visible');
    document.getElementById('modeWysiwyg').classList.add('active');
    document.getElementById('modeRaw').classList.remove('active');
  } else {
    // Keep raw as-is (it's already synced on every change)
    wysiwyg.classList.add('hidden');
    raw.classList.add('visible');
    document.getElementById('modeWysiwyg').classList.remove('active');
    document.getElementById('modeRaw').classList.add('active');
    raw.focus();
  }
}

function markDirty() {
  isDirty = true;
  document.getElementById('savedIndicator').style.display = 'none';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(autoSave, 3000); // autosave after 3s idle
}

async function autoSave() {
  if (!isDirty || !activeFileId) return;
  await saveFile();
}
