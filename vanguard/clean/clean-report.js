/* VanGuard Clean — report snapshot + printable report helpers */
(function () {
  'use strict';

  function makeReportSnapshot({ companyName = '', site = {}, checklist = {}, record = {}, items = [], issues = [], signoff = null, evidence = [] }) {
    return {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      company_name: companyName,
      site: {
        customer_name: site.customer_name || '',
        site_name: site.site_name || '',
        address: site.address || ''
      },
      checklist: {
        name: checklist.name || '',
        frequency: checklist.frequency || ''
      },
      record: {
        id: record.id || null,
        cleaner_name: record.cleaner_name || '',
        status: record.status || '',
        started_at: record.started_at || null,
        completed_at: record.completed_at || null,
        notes: record.notes || ''
      },
      items: items.map(x => ({
        label: x.label || '',
        result: x.result || 'pending',
        note: x.note || '',
        evidence_count: Number(x.evidence_count || 0)
      })),
      issues: issues.map(x => ({
        title: x.title || '',
        description: x.description || '',
        severity: x.severity || 'medium',
        status: x.status || 'open',
        due_date: x.due_date || null,
        resolution: x.resolution || ''
      })),
      signoff: signoff ? {
        signer_name: signoff.signer_name || '',
        signer_role: signoff.signer_role || '',
        signed_at: signoff.signed_at || null
      } : null,
      evidence_count: evidence.length
    };
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? esc(value) : d.toLocaleString();
  }

  function resultLabel(result) {
    return ({ pass: 'PASS', fail: 'FAIL', na: 'N/A', pending: 'PENDING' })[result] || String(result || '').toUpperCase();
  }

  function renderPrintable(snapshot) {
    const passed = snapshot.items.filter(x => x.result === 'pass').length;
    const failed = snapshot.items.filter(x => x.result === 'fail').length;
    const na = snapshot.items.filter(x => x.result === 'na').length;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>VanGuard Clean Report</title><style>
      body{font-family:Arial,sans-serif;margin:36px;color:#18253d}h1{margin:0 0 4px}h2{margin-top:28px;font-size:18px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.stat{border:1px solid #d9dee8;border-radius:8px;padding:12px}.stat b{display:block;font-size:22px}.meta{line-height:1.6}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{text-align:left;padding:9px;border-bottom:1px solid #e5e7eb;vertical-align:top}th{font-size:12px;text-transform:uppercase}.pass{font-weight:bold}.fail{font-weight:bold}.issue{border-left:4px solid #bbb;padding:8px 12px;margin:8px 0;background:#f7f8fa}.signoff{margin-top:30px;padding-top:15px;border-top:1px solid #ddd}@media print{body{margin:15mm}.no-print{display:none}}</style></head><body>
      <h1>${esc(snapshot.company_name || 'VanGuard Clean')}</h1><div class="muted">Cleaning completion report</div>
      <h2>${esc(snapshot.site.customer_name)} — ${esc(snapshot.site.site_name)}</h2>
      <div class="meta"><b>Address:</b> ${esc(snapshot.site.address || '—')}<br><b>Checklist:</b> ${esc(snapshot.checklist.name)}<br><b>Cleaner:</b> ${esc(snapshot.record.cleaner_name || '—')}<br><b>Started:</b> ${formatDate(snapshot.record.started_at)}<br><b>Completed:</b> ${formatDate(snapshot.record.completed_at)}<br><b>Status:</b> ${esc(snapshot.record.status)}</div>
      <div class="grid"><div class="stat"><b>${passed}</b>Passed</div><div class="stat"><b>${failed}</b>Failed</div><div class="stat"><b>${na}</b>N/A</div></div>
      <h2>Checklist results</h2><table><thead><tr><th>Task</th><th>Result</th><th>Notes</th><th>Evidence</th></tr></thead><tbody>${snapshot.items.map(x=>`<tr><td>${esc(x.label)}</td><td>${esc(resultLabel(x.result))}</td><td>${esc(x.note || '—')}</td><td>${x.evidence_count || 0}</td></tr>`).join('')}</tbody></table>
      <h2>Issues / corrective actions</h2>${snapshot.issues.length ? snapshot.issues.map(x=>`<div class="issue"><b>${esc(x.title)}</b> · ${esc(x.severity)} · ${esc(x.status)}<br>${esc(x.description || '')}${x.due_date ? `<br><span class="muted">Due: ${esc(x.due_date)}</span>` : ''}${x.resolution ? `<br><b>Resolution:</b> ${esc(x.resolution)}` : ''}</div>`).join('') : '<p class="muted">No issues recorded.</p>'}
      ${snapshot.record.notes ? `<h2>General notes</h2><p>${esc(snapshot.record.notes)}</p>` : ''}
      ${snapshot.signoff ? `<div class="signoff"><b>Client sign-off</b><br>${esc(snapshot.signoff.signer_name)}${snapshot.signoff.signer_role ? ` · ${esc(snapshot.signoff.signer_role)}` : ''}<br>${formatDate(snapshot.signoff.signed_at)}</div>` : ''}
      <p class="muted" style="margin-top:35px">Generated by VanGuard Clean · ${formatDate(snapshot.generated_at)}</p>
      <script>window.onload=()=>window.print();</script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) throw new Error('Popup blocked. Allow popups to print the report.');
    w.document.write(html); w.document.close();
    return html;
  }

  window.VGCleanReport = { makeReportSnapshot, renderPrintable };
})();
