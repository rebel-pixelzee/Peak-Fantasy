// Add your Supabase Project URL and publishable key here. Never put a service_role/secret key in this file.
const SUPABASE_URL = 'https://ipkooegrlrhomwqjwspu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P_znvVN93Jz_a4ym-qCa_A_zvDNLGck';
const BUCKET = 'Game-update';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);
const show = (id, msg) => { $(id).textContent = msg; };

async function refreshSession() {
  const { data } = await client.auth.getSession();
  $('login-panel').classList.toggle('hidden', !!data.session);
  $('release-panel').classList.toggle('hidden', !data.session);
}
$('login-btn').addEventListener('click', async () => {
  if (SUPABASE_PUBLISHABLE_KEY.startsWith('PASTE_')) {
    show('login-msg', 'Setup needed: paste your Supabase publishable key in admin.js first.'); return;
  }
  show('login-msg', 'Signing in…');
  const { error } = await client.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
  if (error) { show('login-msg', error.message); return; }
  show('login-msg', 'Signed in successfully.');
  await refreshSession();
});
$('logout-btn').addEventListener('click', async () => { await client.auth.signOut(); await refreshSession(); });

$('zip-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  show('publish-msg', 'Reading ZIP version…');
  try {
    const zip = await JSZip.loadAsync(file);
    const versionFile = zip.file('MonRes/version') || zip.file('MonRes/version.json');
    if (!versionFile) throw new Error('MonRes/version was not found inside this ZIP.');
    const meta = JSON.parse(await versionFile.async('string'));
    $('build').value = meta.build || meta.version || '';
    $('version-name').value = meta.version ? `Peak Fantasy ${meta.version}` : 'Peak Fantasy';
    show('publish-msg', `Detected version ${meta.version || '—'} · build ${meta.build || '—'}. Add changelog, then publish.`);
  } catch (err) { show('publish-msg', `Could not read version: ${err.message}`); }
});

$('publish-btn').addEventListener('click', async () => {
  const zipFile = $('zip-file').files[0];
  const bagFile = $('bag-file').files[0];
  if (!zipFile) { show('publish-msg', 'Please choose the update ZIP first.'); return; }
  if (!$('build').value.trim()) { show('publish-msg', 'Build/version is missing.'); return; }
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) { show('publish-msg', 'Your session expired. Sign in again.'); await refreshSession(); return; }
  const btn = $('publish-btn'); btn.disabled = true;
  try {
    show('publish-msg', 'Uploading update ZIP…');
    const stamp = Date.now();
    const zipPath = `releases/${stamp}-${zipFile.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    let result = await client.storage.from(BUCKET).upload(zipPath, zipFile, { upsert: true, contentType: 'application/zip' });
    if (result.error) throw result.error;
    const { data: zipPublic } = client.storage.from(BUCKET).getPublicUrl(zipPath);
    let bagUrl = '';
    if (bagFile) {
      show('publish-msg', 'Uploading Bag.db…');
      const bagPath = `releases/${stamp}-Bag.db`;
      result = await client.storage.from(BUCKET).upload(bagPath, bagFile, { upsert: true, contentType: 'application/octet-stream' });
      if (result.error) throw result.error;
      bagUrl = client.storage.from(BUCKET).getPublicUrl(bagPath).data.publicUrl;
    }
    const manifest = {
      id: 1,
      build: $('build').value.trim(),
      version_name: $('version-name').value.trim() || 'Peak Fantasy',
      changelog: $('changelog').value.trim(),
      url: zipPublic.publicUrl,
      bag_db_url: bagUrl,
      published_at: new Date().toISOString()
    };
    show('publish-msg', 'Saving release information…');
    const { error } = await client.from('release_manifest').upsert(manifest, { onConflict: 'id' });
    if (error) throw error;
    show('publish-msg', 'Published! Upload complete. Public website manifest has been updated in Supabase.\nZIP: ' + manifest.url + (bagUrl ? '\nBag.db: ' + bagUrl : ''));
  } catch (err) {
    show('publish-msg', 'Publish failed: ' + (err.message || String(err)) + '\nCheck your Supabase bucket/table policies.');
  } finally { btn.disabled = false; }
});
refreshSession();
