/* VanGuard Clean workflow helpers.
 * Loaded by the Clean app when wired into the runner.
 * No secrets; all writes use the authenticated Supabase session.
 */
window.VGCleanWorkflow = {
  resultOptions: [
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' },
    { value: 'na', label: 'N/A' }
  ],

  async uploadEvidence({ supaUrl, accessToken, userId, recordId, recordItemId, file }) {
    if (!file) throw new Error('Choose a photo first.');
    if (!file.type.startsWith('image/')) throw new Error('Evidence must be an image.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Photos must be 10 MB or smaller.');

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const objectPath = `${userId}/${recordId}/${crypto.randomUUID()}.${ext}`;
    const upload = await fetch(`${supaUrl}/storage/v1/object/clean-evidence/${objectPath}`, {
      method: 'POST',
      headers: { apikey: accessToken, Authorization: `Bearer ${accessToken}`, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' },
      body: file
    });
    if (!upload.ok) throw new Error('Could not upload the photo.');

    const meta = await fetch(`${supaUrl}/rest/v1/clean_evidence`, {
      method: 'POST',
      headers: { apikey: accessToken, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: userId, record_id: recordId, record_item_id: recordItemId || null, storage_path: objectPath, file_name: file.name, mime_type: file.type || null, file_size: file.size, captured_at: new Date().toISOString() })
    });
    if (!meta.ok) {
      await fetch(`${supaUrl}/storage/v1/object/clean-evidence/${objectPath}`, { method: 'DELETE', headers: { apikey: accessToken, Authorization: `Bearer ${accessToken}` } });
      throw new Error('Photo uploaded but could not be recorded. Please try again.');
    }
    return await meta.json();
  },

  async createSignedUrl({ supaUrl, accessToken, path, expiresIn = 3600 }) {
    const r = await fetch(`${supaUrl}/storage/v1/object/sign/clean-evidence/${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: { apikey: accessToken, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn })
    });
    if (!r.ok) throw new Error('Could not load evidence photo.');
    const data = await r.json();
    return data.signedURL || data.signedUrl;
  }
};
