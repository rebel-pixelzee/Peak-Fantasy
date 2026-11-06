// Replace this demo metadata with your published release manifest when ready.
fetch('version.json').then(r => r.ok ? r.json() : null).then(data => {
  if (!data) return;
  if (data.build) document.getElementById('version').textContent = data.build;
  if (data.changelog) document.getElementById('release-note').textContent = data.changelog;
}).catch(() => {});
