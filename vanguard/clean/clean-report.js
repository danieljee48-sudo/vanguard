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

  function renderPrintable(snapshot, photos = []) {
    const passed = snapshot.items.filter(x => x.result === 'pass').length;
    const failed = snapshot.items.filter(x => x.result === 'fail').length;
    const na = snapshot.items.filter(x => x.result === 'na').length;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>VanGuard Clean Report</title><style>
      body{font-family:Arial,sans-serif;margin:36px;color:#18253d}h1{margin:0 0 4px}h2{margin-top:28px;font-size:18px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.stat{border:1px solid #d9dee8;border-radius:8px;padding:12px}.stat b{display:block;font-size:22px}.meta{line-height:1.6}table{width:100%;border-collapse:collapse;margin-top:10px} .gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}.gallery figure{margin:0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}.gallery img{display:block;width:100%;height:220px;object-fit:cover}.gallery figcaption{padding:7px;font-size:11px;color:#667085}th,td{text-align:left;padding:9px;border-bottom:1px solid #e5e7eb;vertical-align:top}th{font-size:12px;text-transform:uppercase}.pass{font-weight:bold}.fail{font-weight:bold}.issue{border-left:4px solid #bbb;padding:8px 12px;margin:8px 0;background:#f7f8fa}.signoff{margin-top:30px;padding-top:15px;border-top:1px solid #ddd}@media print{body{margin:15mm}.no-print{display:none}}</style></head><body>
      <h1>${esc(snapshot.company_name || 'VanGuard Clean')}</h1><div class="muted">Cleaning completion report</div>
      <h2>${esc(snapshot.site.customer_name)} — ${esc(snapshot.site.site_name)}</h2>
      <div class="meta"><b>Address:</b> ${esc(snapshot.site.address || '—')}<br><b>Checklist:</b> ${esc(snapshot.checklist.name)}<br><b>Cleaner:</b> ${esc(snapshot.record.cleaner_name || '—')}<br><b>Started:</b> ${formatDate(snapshot.record.started_at)}<br><b>Completed:</b> ${formatDate(snapshot.record.completed_at)}<br><b>Status:</b> ${esc(snapshot.record.status)}</div>
      <div class="grid"><div class="stat"><b>${passed}</b>Passed</div><div class="stat"><b>${failed}</b>Failed</div><div class="stat"><b>${na}</b>N/A</div></div>
      <h2>Checklist results</h2><table><thead><tr><th>Task</th><th>Result</th><th>Notes</th><th>Evidence</th></tr></thead><tbody>${snapshot.items.map(x=>`<tr><td>${esc(x.label)}</td><td>${esc(resultLabel(x.result))}</td><td>${esc(x.note || '—')}</td><td>${x.evidence_count || 0}</td></tr>`).join('')}</tbody></table>
      <h2>Photo evidence</h2>${photos.length ? `<div class="gallery">${photos.map((p,i)=>`<figure><img src="${esc(p.url)}" alt="Evidence photo ${i+1}"><figcaption>${esc(p.file_name || `Evidence photo ${i+1}`)}</figcaption></figure>`).join('')}</div>` : '<p class="muted">No photo evidence attached.</p>'}
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

  function makeEmailHtml(snapshot, photos = []) {
    const passed=snapshot.items.filter(x=>x.result==='pass').length;
    const failed=snapshot.items.filter(x=>x.result==='fail').length;
    const na=snapshot.items.filter(x=>x.result==='na').length;
    const photoHtml=photos.length ? photos.map((p,i)=>`<td style="padding:4px"><img src="cid:evidence-${i}" alt="Evidence photo ${i+1}" style="display:block;width:150px;height:110px;object-fit:cover;border-radius:8px"></td>`).join('') : '';
    return `<!doctype html><html><body style="margin:0;background:#f4f7f8;font-family:Arial,sans-serif;color:#17233b"><table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;background:#f4f7f8"><tr><td align="center"><table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden"><tr><td style="background:#1a2744;padding:24px 28px;color:#fff"><div style="font-size:24px;font-weight:800">Van<span style="color:#4ecdc4">Guard</span> <span style="font-size:12px;opacity:.7">CLEAN</span></div><div style="margin-top:6px;color:#cbd5e1;font-size:13px">Cleaning completion report</div></td></tr><tr><td style="padding:28px"><h1 style="margin:0 0 5px;font-size:22px">${esc(snapshot.site.site_name || 'Cleaning report')}</h1><p style="margin:0 0 22px;color:#64748b">${esc(snapshot.site.customer_name || '')} · ${esc(snapshot.checklist.name || '')}</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px;background:#f8fafc;border-radius:8px"><b>Status</b><br>${esc(snapshot.record.status || 'completed')}</td><td width="8"></td><td style="padding:12px;background:#f8fafc;border-radius:8px"><b>Cleaner</b><br>${esc(snapshot.record.cleaner_name || '—')}</td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr><td style="padding:12px;background:#f8fafc"><b>${passed}</b><br><span style="color:#64748b">Passed</span></td><td style="padding:12px;background:#f8fafc"><b>${failed}</b><br><span style="color:#64748b">Failed</span></td><td style="padding:12px;background:#f8fafc"><b>${na}</b><br><span style="color:#64748b">N/A</span></td><td style="padding:12px;background:#f8fafc"><b>${photos.length}</b><br><span style="color:#64748b">Photos</span></td></tr></table><h2 style="font-size:16px;margin:26px 0 10px">Checklist results</h2><table width="100%" cellpadding="0" cellspacing="0">${snapshot.items.map(x=>`<tr><td style="padding:9px 0;border-bottom:1px solid #eef2f7">${esc(x.label)}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #eef2f7;font-weight:700">${esc(resultLabel(x.result))}</td></tr>`).join('')}</table>${photos.length?`<h2 style="font-size:16px;margin:26px 0 10px">Photo evidence</h2><table cellpadding="0" cellspacing="0"><tr>${photoHtml}</tr></table>`:''}${snapshot.record.notes?`<h2 style="font-size:16px;margin:26px 0 8px">Notes</h2><p style="color:#475569;line-height:1.6">${esc(snapshot.record.notes)}</p>`:''}${snapshot.signoff?`<div style="margin-top:24px;padding:14px;border-top:1px solid #e2e8f0"><b>Client sign-off</b><br>${esc(snapshot.signoff.signer_name)}${snapshot.signoff.signer_role?` · ${esc(snapshot.signoff.signer_role)}`:''}<br><span style="color:#64748b">${formatDate(snapshot.signoff.signed_at)}</span></div>`:''}</td></tr><tr><td style="padding:18px 28px;background:#f8fafc;color:#94a3b8;font-size:11px">Generated by VanGuard Clean · ${formatDate(snapshot.generated_at)}</td></tr></table></td></tr></table></body></html>`;
  }

  window.VGCleanReport = { makeReportSnapshot, renderPrintable, makeEmailHtml };
})();
