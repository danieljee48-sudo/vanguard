/* VanGuard Clean — integration layer for the compact frontend. */
(function () {
  'use strict';

  const originalLoadAll = window.loadAll;
  const SUPA_URL = 'https://qzzwkxborlmmyaukvhga.supabase.co';
  let itemCounts = {};
  let activeRunner = null;

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem('vg_clean_session') || 'null'); } catch (_) { return null; }
  }
  function el(id) { return document.getElementById(id); }

  async function refreshCounts() {
    if (!window.checklists && !originalLoadAll) return;
    const lists = await window.api('clean_checklists?active=eq.true&order=created_at.desc');
    const pairs = await Promise.all(lists.map(async c => {
      try {
        const rows = await window.api(`clean_checklist_items?checklist_id=eq.${c.id}&select=id`);
        return [c.id, rows.length];
      } catch (_) { return [c.id, 0]; }
    }));
    itemCounts = Object.fromEntries(pairs);
  }
  window.checklistItemsCount = id => itemCounts[id] ?? 0;

  if (originalLoadAll) {
    window.loadAll = async function () {
      await originalLoadAll();
      try {
        await refreshCounts();
        const lists = await window.api('clean_checklists?active=eq.true&order=created_at.desc');
        const target = el('checklistList');
        if (target) target.innerHTML = lists.map(c => `<div class="row"><div><strong>${esc(c.name)}</strong><small>${esc(c.description || 'No description')} · ${esc(c.frequency)}</small></div><span class="badge">${checklistItemsCount(c.id)} tasks</span></div>`).join('') || '<div class="empty">Create a checklist template.</div>';
      } catch (_) {}
    };
  }

  async function getSites() { return window.api('clean_sites?active=eq.true&order=created_at.desc'); }
  async function getChecklists() { return window.api('clean_checklists?active=eq.true&order=created_at.desc'); }

  window.startClean = async function () {
    try {
      const [sites, checklists] = await Promise.all([getSites(), getChecklists()]);
      window.showTab('runner');
      const runner = el('runner'), body = el('runnerBody');
      if (runner) runner.classList.remove('hidden');
      if (!sites.length || !checklists.length) {
        body.innerHTML = '<div class="notice">Add at least one site and one checklist before starting a clean.</div>';
        return;
      }
      body.innerHTML = `<div class="form"><label>Site<select id="runSite">${sites.map(s => `<option value="${s.id}">${esc(s.customer_name)} — ${esc(s.site_name)}</option>`).join('')}</select></label><label>Checklist<select id="runChecklist">${checklists.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><label>Cleaner name<input id="runCleaner" placeholder="Your name"></label><div class="actions"><button class="btn" id="beginCleanBtn">Begin cleaning</button></div></div>`;
      el('beginCleanBtn').onclick = () => window.beginRecord();
    } catch (e) { alert(e.message); }
  };

  window.beginRecord = async function () {
    try {
      const siteId = el('runSite').value, checklistId = el('runChecklist').value;
      const [sites, checklists, items] = await Promise.all([getSites(), getChecklists(), window.api(`clean_checklist_items?checklist_id=eq.${checklistId}&order=sort_order.asc`)]);
      const site = sites.find(x => x.id === siteId) || {};
      const checklist = checklists.find(x => x.id === checklistId) || {};
      const existing = await window.api(`clean_records?site_id=eq.${siteId}&checklist_id=eq.${checklistId}&status=eq.in_progress&order=created_at.desc&limit=1`);
      let record = existing[0];
      if (!record) {
        const r = await window.api('clean_records', { method:'POST', body:JSON.stringify({ site_id:siteId, checklist_id:checklistId, cleaner_name:el('runCleaner').value.trim() || 'Cleaner', status:'in_progress' }) });
        record = r[0];
      }
      activeRunner = window.VGCleanRunner ? window.VGCleanRunner.makeRunner({ site, checklist, items, recordId: record.id }) : null;
      if (!activeRunner) throw new Error('Cleaning runner failed to load.');
      const prior = await window.api(`clean_record_items?record_id=eq.${record.id}&order=created_at.asc`);
      prior.forEach(p => { const i = activeRunner.item(p.checklist_item_id); if (i) { i.result = p.result; i.note = p.note || ''; } });
      renderRunner(record, site, checklist);
    } catch (e) { alert(e.message); }
  };

  function renderRunner(record, site, checklist) {
    const body = el('runnerBody');
    body.innerHTML = `<div class="eyebrow">${esc(site.site_name)}</div><h2>${esc(checklist.name)}</h2><p class="notice">Complete every required task. Failed tasks are recorded as corrective actions.</p><div id="runItems" class="list">${activeRunner.state.items.map(x => `<div class="check" data-item-row="${x.id}" style="display:grid;grid-template-columns:1fr auto;gap:10px"><div><strong>${esc(x.label)}</strong></div><select data-item="${x.id}"><option value="pending">Choose result</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="na">N/A</option></select><textarea data-note="${x.id}" placeholder="Optional note" style="grid-column:1/-1;min-height:54px">${esc(x.note)}</textarea><input data-photo="${x.id}" type="file" accept="image/*" capture="environment" style="grid-column:1/-1"></div>`).join('')}</div><div class="section form"><label>General notes<textarea id="runNotes" placeholder="Anything the client or supervisor should know...">${esc(activeRunner.state.generalNote)}</textarea></label><div class="actions"><button class="btn" id="completeCleanBtn">Complete clean</button><button class="btn secondary" id="saveCleanBtn">Save & resume later</button></div></div>`;
    activeRunner.state.items.forEach(x => {
      const row = document.querySelector(`[data-item-row="${CSS.escape(x.id)}"]`);
      if (row) row.querySelector('select').value = x.result;
    });
    document.querySelectorAll('#runItems select').forEach(s => s.onchange = () => activeRunner.setResult(s.dataset.item, s.value));
    document.querySelectorAll('#runItems textarea').forEach(t => t.oninput = () => activeRunner.setNote(t.dataset.note, t.value));
    el('completeCleanBtn').onclick = () => window.completeRecord(record.id);
    el('saveCleanBtn').onclick = () => window.saveCleanForLater(record.id);
  }

  window.saveCleanForLater = async function (id) {
    try {
      if (!activeRunner || activeRunner.state.recordId !== id) throw new Error('No active cleaning session.');
      const note = el('runNotes')?.value.trim() || null;
      activeRunner.state.generalNote = note || '';
      await window.api(`clean_records?id=eq.${id}`, { method:'PATCH', body:JSON.stringify({ notes:note, status:'in_progress' }) });
      await window.loadAll();
      window.showTab('dashboard');
      alert('Saved. You can resume this clean from Records.');
    } catch (e) { alert(e.message); }
  };

  window.completeRecord = async function (id) {
    try {
      if (!activeRunner || activeRunner.state.recordId !== id) throw new Error('No active cleaning session.');
      const check = activeRunner.validation();
      if (!check.valid) throw new Error(`Complete all ${check.pending.length} remaining task${check.pending.length === 1 ? '' : 's'} before finishing.`);
      activeRunner.state.generalNote = el('runNotes')?.value.trim() || '';
      const rows = [...document.querySelectorAll('#runItems > .check')];
      for (const row of rows) {
        const itemId = row.querySelector('select').dataset.item;
        const itemState = activeRunner.item(itemId);
        const inserted = await window.api('clean_record_items', { method:'POST', body:JSON.stringify({ record_id:id, checklist_item_id:itemId, label:itemState.label, result:itemState.result, note:itemState.note }) });
        const recordItemId = inserted?.[0]?.id;
        const photo = row.querySelector('input[type=file]')?.files?.[0];
        if (recordItemId && photo && window.VGCleanWorkflow) {
          const s = getSession();
          try { await window.VGCleanWorkflow.uploadEvidence({ supaUrl:SUPA_URL, accessToken:s?.access_token, userId:s?.user?.id, recordId:id, recordItemId, file:photo }); } catch (e) { console.warn('Evidence upload failed', e); }
        }
      }
      const failed = check.failed;
      await window.api(`clean_records?id=eq.${id}`, { method:'PATCH', body:JSON.stringify({ status:failed.length ? 'flagged' : 'completed', completed_at:new Date().toISOString(), notes:activeRunner.state.generalNote || null }) });
      for (const x of failed) await window.api('clean_issues', { method:'POST', body:JSON.stringify({ record_id:id, title:x.label, description:x.note || 'Checklist task failed during cleaning.', severity:'medium', status:'open' }) });
      await window.loadAll();
      const body = el('runnerBody');
      body.innerHTML = `<div class="notice">${failed.length ? `Clean completed with ${failed.length} corrective action${failed.length === 1 ? '' : 's'} flagged.` : 'Clean completed successfully.'}</div><div class="actions"><button class="btn" id="viewReportBtn">View report</button><button class="btn secondary" id="backDashboardBtn">Back to dashboard</button></div>`;
      el('viewReportBtn').onclick = () => window.openReport(id);
      el('backDashboardBtn').onclick = () => window.showTab('dashboard');
    } catch (e) { alert(e.message); }
  };

  window.openReport = async function (id) {
    try {
      const record = (await window.api(`clean_records?id=eq.${id}`))[0];
      if (!record) throw new Error('Record not found');
      const [sites, checklists, items, issueRows] = await Promise.all([getSites(), getChecklists(), window.api(`clean_record_items?record_id=eq.${id}&order=created_at.asc`), window.api(`clean_issues?record_id=eq.${id}&order=created_at.asc`)]);
      const site = sites.find(x => x.id === record.site_id) || {}, checklist = checklists.find(x => x.id === record.checklist_id) || {};
      const snapshot = window.VGCleanReport.makeReportSnapshot({ companyName:'VanGuard Clean', site, checklist, record, items, issues:issueRows });
      await window.api('clean_report_snapshots', { method:'POST', body:JSON.stringify({ record_id:id, report_number:'VC-' + Date.now(), snapshot }) });
      window.VGCleanReport.renderPrintable(snapshot);
    } catch (e) { alert(e.message); }
  };
})();