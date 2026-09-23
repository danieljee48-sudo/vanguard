/* VanGuard Clean — record history, evidence gallery and client report email. */
(function(){
  'use strict';
  const U='https://qzzwkxborlmmyaukvhga.supabase.co';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const sess=()=>{try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}};
  const api=(...a)=>window.api(...a);
  const el=id=>document.getElementById(id);
  function fmt(v){return v?new Date(v).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—'}
  function statusClass(s){return s==='completed'?'ok':s==='flagged'?'warn':'neutral'}
  async function getRecordData(id){
    const [r,sites,lists,items,evidence,issues,signoffs]=await Promise.all([
      api('clean_records?id=eq.'+encodeURIComponent(id)+'&limit=1'),
      api('clean_sites?active=eq.true'),
      api('clean_checklists?active=eq.true'),
      api('clean_record_items?record_id=eq.'+encodeURIComponent(id)+'&order=created_at.asc'),
      api('clean_evidence?record_id=eq.'+encodeURIComponent(id)+'&order=captured_at.asc'),
      api('clean_issues?record_id=eq.'+encodeURIComponent(id)+'&order=created_at.asc'),
      api('clean_signoffs?record_id=eq.'+encodeURIComponent(id)+'&limit=1')
    ]);
    if(!r[0])throw new Error('Cleaning record not found.');
    const record=r[0], site=sites.find(x=>x.id===record.site_id)||{}, checklist=lists.find(x=>x.id===record.checklist_id)||{};
    const photoUrls=[];
    for(const p of evidence){
      try{
        let url=await window.VGCleanWorkflow.createSignedUrl({supaUrl:U,accessToken:sess()?.access_token,path:p.storage_path,expiresIn:7200});
        if(url&&!/^https?:\/\//i.test(url))url=U+url;
        photoUrls.push({...p,url});
      }catch(_){}
    }
    return {record,site,checklist,items,evidence:photoUrls,issues,signoff:signoffs[0]||null};
  }
  function ensureModal(){
    if(el('recordModal'))return el('recordModal');
    const m=document.createElement('div');m.id='recordModal';m.className='modal hidden';m.innerHTML='<div class="modal-backdrop" data-close-modal></div><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="recordModalTitle"><div class="modal-head"><div><div class="eyebrow">Cleaning record</div><h2 id="recordModalTitle">Record</h2></div><button class="icon-btn" type="button" data-close-modal aria-label="Close">×</button></div><div id="recordModalBody"></div></div>';
    document.body.appendChild(m);
    m.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>m.classList.add('hidden')));
    return m;
  }
  function photoGallery(photos){
    if(!photos.length)return '<div class="empty">No photos were attached to this clean.</div>';
    return '<div class="photo-grid">'+photos.map((p,i)=>'<a href="'+esc(p.url)+'" target="_blank" rel="noreferrer" class="photo-tile"><img src="'+esc(p.url)+'" alt="'+esc(p.file_name||'Cleaning evidence photo')+'"><span>'+esc(p.file_name||('Photo '+(i+1)))+'</span></a>').join('')+'</div>';
  }
  async function viewRecord(id){
    try{
      const m=ensureModal();el('recordModalBody').innerHTML='<div class="loading-state">Loading record…</div>';m.classList.remove('hidden');
      const d=await getRecordData(id);
      const passed=d.items.filter(x=>x.result==='pass').length,failed=d.items.filter(x=>x.result==='fail').length,na=d.items.filter(x=>x.result==='na').length;
      el('recordModalTitle').textContent=d.site.site_name||'Cleaning record';
      el('recordModalBody').innerHTML='<div class="record-summary"><div><strong>'+esc(d.site.customer_name||'')+'</strong><span>'+esc(d.site.address||'')+'</span></div><span class="status-pill '+statusClass(d.record.status)+'">'+esc(d.record.status.replace('_',' '))+'</span></div>'+
        '<div class="history-stats"><div><b>'+passed+'</b><small>Passed</small></div><div><b>'+failed+'</b><small>Failed</small></div><div><b>'+na+'</b><small>N/A</small></div><div><b>'+d.evidence.length+'</b><small>Photos</small></div></div>'+
        '<div class="detail-grid"><div><small>Checklist</small><strong>'+esc(d.checklist.name||'—')+'</strong></div><div><small>Cleaner</small><strong>'+esc(d.record.cleaner_name||'—')+'</strong></div><div><small>Started</small><strong>'+fmt(d.record.started_at)+'</strong></div><div><small>Completed</small><strong>'+fmt(d.record.completed_at)+'</strong></div></div>'+
        '<h3>Checklist results</h3><div class="history-items">'+d.items.map(x=>'<div class="history-item"><div><strong>'+esc(x.label)+'</strong>'+(x.note?'<small>'+esc(x.note)+'</small>':'')+'</div><span class="status-pill '+statusClass(x.result)+'">'+esc(x.result==='na'?'N/A':x.result)+'</span></div>').join('')+'</div>'+
        '<h3>Photos & evidence</h3>'+photoGallery(d.evidence)+
        (d.issues.length?'<h3>Issues & corrective actions</h3><div class="history-items">'+d.issues.map(x=>'<div class="history-item"><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.description||'')+'</small></div><span class="status-pill '+statusClass(x.status)+'">'+esc(x.status)+'</span></div>').join('')+'</div>':'')+(d.record.notes?'<h3>Notes</h3><p class="modal-copy">'+esc(d.record.notes)+'</p>':'')+
        (d.signoff?'<div class="signoff-box"><strong>Signed off by '+esc(d.signoff.signer_name)+'</strong><span>'+esc(d.signoff.signer_role||'')+' · '+fmt(d.signoff.signed_at)+'</span></div>':'')+
        '<div class="modal-actions"><button class="btn" type="button" id="modalReportBtn">View / print report</button><button class="btn secondary" type="button" id="modalEmailBtn">Email report</button></div>';
      el('modalReportBtn').onclick=async()=>{m.classList.add('hidden');await window.openRecordReport(id)};
      el('modalEmailBtn').onclick=()=>showEmailForm(id);
    }catch(e){alert(e.message||'Could not load record.')}
  }
  async function openRecordReport(id){
    const d=await getRecordData(id);
    const snap=window.VGCleanReport.makeReportSnapshot({companyName:'VanGuard Clean',site:d.site,checklist:d.checklist,record:d.record,items:d.items,issues:d.issues,signoff:d.signoff,evidence:d.evidence});
    window.VGCleanReport.renderPrintable(snap,d.evidence);
  }
  function showEmailForm(id){
    const m=ensureModal(),body=el('recordModalBody');
    body.innerHTML='<div class="email-form"><h3>Email this report</h3><p class="modal-copy">Send a polished completion report with the cleaning summary and attached evidence photos.</p><label>Client / manager email<input id="reportEmail" type="email" inputmode="email" autocomplete="email" placeholder="name@company.com"></label><label>Subject<input id="reportSubject" type="text"></label><div class="modal-actions"><button class="btn secondary" type="button" id="emailCancelBtn">Back</button><button class="btn" type="button" id="emailSendBtn">Send report</button></div><div id="emailStatus" class="form-help"></div></div>';
    el('reportSubject').value='Cleaning report — VanGuard Clean';
    el('emailCancelBtn').onclick=()=>viewRecord(id);
    el('emailSendBtn').onclick=()=>sendRecordEmail(id);
  }
  async function sendRecordEmail(id){
    const to=el('reportEmail').value.trim(),subject=el('reportSubject').value.trim()||'Cleaning report — VanGuard Clean',status=el('emailStatus'),btn=el('emailSendBtn');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)){status.textContent='Enter a valid email address.';return}
    btn.disabled=true;btn.textContent='Sending…';status.textContent='Preparing report and photos…';
    try{
      const d=await getRecordData(id);
      const snap=window.VGCleanReport.makeReportSnapshot({companyName:'VanGuard Clean',site:d.site,checklist:d.checklist,record:d.record,items:d.items,issues:[],signoff:d.signoff,evidence:d.evidence});
      const html=window.VGCleanReport.makeEmailHtml(snap,d.evidence);
      const attachments=d.evidence.slice(0,10).map((p,i)=>({path:p.url,filename:p.file_name||('evidence-'+(i+1)+'.jpg'),content_type:p.mime_type||'image/jpeg',content_id:'evidence-'+i}));
      const r=await fetch('/.netlify/functions/send-records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,subject,html,token:sess()?.access_token,attachments})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'Email could not be sent.');
      status.textContent='Report sent successfully.';
      btn.textContent='Sent ✓';
    }catch(e){status.textContent=e.message||'Email could not be sent.';btn.disabled=false;btn.textContent='Send report'}
  }
  window.viewRecord=viewRecord;
  window.openRecordReport=openRecordReport;
  window.emailRecordReport=showEmailForm;
})();
