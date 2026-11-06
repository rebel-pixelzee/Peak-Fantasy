// Paste the same Supabase publishable key used in admin.js.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P_znvVN93Jz_a4ym-qCa_A_zvDNLGck';
async function loadRelease() {
  // Keep the local JSON as a fallback for the first launch.
  try {
    const local = await fetch('version.json').then(r => r.ok ? r.json() : null);
    if (local) renderRelease(local);
  } catch (_) {}
  if (SUPABASE_PUBLISHABLE_KEY.startsWith('PASTE_')) return;
  try {
    const response = await fetch('https://ipkooegrlrhomwqjwspu.supabase.co/rest/v1/release_manifest?id=eq.1&select=*', {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` }
    });
    if (!response.ok) return;
    const rows = await response.json();
    if (rows && rows[0]) renderRelease(rows[0]);
  } catch (_) {}
}
function renderRelease(data) {
  const version = document.getElementById('version');
  const note = document.getElementById('release-note');
  const download = document.getElementById('download-update');
  if (version) version.textContent = data.build || data.version || '—';
  if (note) note.textContent = data.changelog || data.version_name || 'Latest release';
  if (download && data.url) {
    download.href = data.url;
    download.textContent = 'Download update package ↗';
    download.classList.remove('disabled');
    download.removeAttribute('aria-disabled');
    download.setAttribute('target', '_blank');
    download.setAttribute('rel', 'noopener');
  }
}
loadRelease();
