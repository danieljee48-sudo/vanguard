/* VanGuard Clean — integrated MVP workflow. */
(function(){'use strict';const U='https://qzzwkxborlmmyaukvhga.supabase.co';let active=null;const el=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));const api=(...a)=>window.api(...a);const sess=()=>{try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}};const uid=()=>window.VGCleanTeam?.getContext?.()?.ownerUserId||sess()?.user?.id||'';
window.startClean=async function(){try{if(typeof window.openCleanStartModal!=='function')throw Error('Clean setup is still loading. Refresh the page and try again.');const[s,c]=await Promise.all([api("clean_sites?active=eq.true&order=created_at.desc"),api("clean_checklists?active=eq.true&order=created_at.desc")]);window.openCleanStartModal(s,c)}catch(e){alert(e.message||'Could not load cleaning setup.')}};
window.beginRecord=async function(){
  const btn=[...document.querySelectorAll('#formModal button')].find(b=>b.textContent.trim()==='Begin cleaning');
  const restore=()=>{if(btn){btn.disabled=false;btn.textContent='Begin cleaning'}};
  try{
    if(!window.VGCleanRunner?.makeRunner)throw Error('Cleaning workflow is still loading. Please wait a moment and try again.');
    const userId=uid();if(!userId)throw Error('Session expired. Please sign in again.');
    const siteEl=el('runSite'),checklistEl=el('runChecklist');
    if(!siteEl||!checklistEl)throw Error('Cleaning setup could not be read. Please close it and try again.');
    const sid=siteEl.value,cid=checklistEl.value,cleaner=el('runCleaner')?.value.trim()||'Cleaner',assignmentId=el('assignmentId')?.value||null;
    if(!sid)throw Error('Choose a site before beginning the clean.');
    if(!cid)throw Error('Choose a checklist before beginning the clean.');
    if(btn){btn.disabled=true;btn.textContent='Starting…'}
    const[s,c,items]=await Promise.all([
      api('clean_sites?id=eq.'+encodeURIComponent(sid)+'&user_id=eq.'+encodeURIComponent(userId)+'&active=eq.true&limit=1'),
      api('clean_checklists?id=eq.'+encodeURIComponent(cid)+'&user_id=eq.'+encodeURIComponent(userId)+'&active=eq.true&limit=1'),
      api('clean_checklist_items?checklist_id=eq.'+encodeURIComponent(cid)+'&order=sort_order.asc')
    ]);
    if(!s[0])throw Error('That site could not be found. Refresh and choose it again.');
    if(!c[0])throw Error('That checklist could not be found. Refresh and choose it again.');
    if(!items.length)throw Error('This checklist has no tasks. Add at least one task before starting a clean.');
    const open=await api('clean_records?user_id=eq.'+encodeURIComponent(userId)+'&site_id=eq.'+encodeURIComponent(sid)+'&checklist_id=eq.'+encodeURIComponent(cid)+'&status=eq.in_progress&order=created_at.desc&limit=1');
    let r=open[0];
    if(!r){const x=await api('clean_records',{method:'POST',body:JSON.stringify({user_id:userId,site_id:sid,checklist_id:cid,cleaner_name:cleaner,status:'in_progress',started_at:new Date().toISOString()})});r=x?.[0];if(!r)throw Error('The cleaning record could not be created. Please try again.');if(assignmentId)await api('clean_assignments?id=eq.'+encodeURIComponent(assignmentId),{method:'PATCH',body:JSON.stringify({status:'in_progress',started_at:new Date().toISOString(),record_id:r.id})});}
    window.closeFormModal?.();window.showTab('runner');
    active=window.VGCleanRunner.makeRunner({site:s[0],checklist:c[0],items,recordId:r.id});active.assignmentId=assignmentId;
    const prior=await api('clean_record_items?record_id=eq.'+encodeURIComponent(r.id)+'&order=created_at.asc');
    prior.forEach(p=>{const x=active.item(p.checklist_item_id);if(x){x.result=p.result||'pending';x.note=p.note||''}});
    active.state.generalNote=r.notes||'';active.state.startedAt=r.started_at||active.state.startedAt;
    renderRunner(r,s[0],c[0]);
  }catch(e){restore();alert(e.message||'Could not begin the clean.')}
};function updateRunnerProgress(){
  if(!active)return;
  const check=active.validation();
  const fill=el('runnerProgressFill'),text=el('runnerProgressText');
  if(fill)fill.style.width=check.completionPercent+'%';
  if(text)text.textContent=check.completedCount+' of '+check.totalCount+' complete';
  const btn=el('completeCleanBtn');
  if(btn)btn.disabled=!check.valid;
}
function focusNextPending(){
  const next=active?.state.items.find(x=>x.required&&x.result==='pending');
  if(!next)return;
  const row=document.querySelector('[data-row="'+CSS.escape(next.id)+'"]');
  if(row)row.scrollIntoView({behavior:'smooth',block:'center'});
}
function renderRunner(r,site,list){
  el('runnerBody').innerHTML=`<div class="eyebrow">${esc(site.site_name)}</div><h2>${esc(list.name)}</h2><div class="progress-wrap" aria-live="polite"><div class="progress-top"><span>Cleaning progress</span><span id="runnerProgressText">0 of ${active.state.items.length} complete</span></div><div class="progress-track"><div id="runnerProgressFill" class="progress-fill"></div></div></div><p class="notice">Tap Pass, Fail or N/A for each task. Add a note or photo when useful.</p><div id="runItems" class="list">${active.state.items.map(x=>`<div class="check task-card" data-row="${esc(x.id)}"><strong>${esc(x.label)}</strong><div class="result-actions" role="group" aria-label="Result for ${esc(x.label)}"><button type="button" class="result-btn pass" data-result="pass" data-item="${esc(x.id)}">✓ Pass</button><button type="button" class="result-btn fail" data-result="fail" data-item="${esc(x.id)}">✕ Fail</button><button type="button" class="result-btn na" data-result="na" data-item="${esc(x.id)}">N/A</button></div><textarea data-note="${esc(x.id)}" placeholder="Add a note (optional)"></textarea><label class="photo">Photo evidence (optional)<input type="file" data-photo="${esc(x.id)}" accept="image/*" capture="environment"><span class="photo-preview-note">Take a photo or choose one from your phone. It will be saved with this cleaning record.</span></label></div>`).join('')}</div><div class="section form runner-actions"><label>General notes<textarea id="runNotes">${esc(active.state.generalNote)}</textarea></label><div class="actions"><button class="btn" id="completeCleanBtn" disabled>Complete clean</button><button class="btn secondary" id="saveCleanBtn">Save & resume later</button></div></div>`;
  active.state.items.forEach(x=>{
    const row=document.querySelector('[data-row="'+CSS.escape(x.id)+'"]');
    if(!row)return;
    const note=row.querySelector('[data-note]');
    if(note)note.value=x.note||'';
    row.querySelectorAll('[data-result]').forEach(btn=>btn.classList.toggle('active',btn.dataset.result===x.result));
  });
  document.querySelectorAll('#runItems [data-result]').forEach(btn=>btn.onclick=()=>{
    active.setResult(btn.dataset.item,btn.dataset.result);
    const row=btn.closest('[data-row]');
    row?.querySelectorAll('[data-result]').forEach(x=>x.classList.toggle('active',x.dataset.result===btn.dataset.result));
    updateRunnerProgress();
    setTimeout(focusNextPending,120);
  });
  document.querySelectorAll('#runItems textarea').forEach(t=>t.oninput=()=>active.setNote(t.dataset.note,t.value));
  document.querySelectorAll('#runItems [data-photo]').forEach(input=>input.onchange=async()=>{
    const file=input.files?.[0];if(!file)return;
    const row=input.closest('[data-row]'),itemId=input.dataset.photo;
    try{
      const saved=await upsertRecordItem(r.id,{record_id:r.id,checklist_item_id:itemId,label:active.item(itemId)?.label||'',result:active.item(itemId)?.result||'pending',note:active.item(itemId)?.note||''});
      const s=sess();
      await window.VGCleanWorkflow.uploadEvidence({supaUrl:U,accessToken:s?.access_token,userId:s?.user?.id,recordId:r.id,recordItemId:saved.id,file});
      row.querySelector('.photo-preview-note').textContent='Photo saved ✓';input.dataset.uploaded='true';
    }catch(e){input.value='';alert(e.message)}
  });
  el('completeCleanBtn').onclick=async()=>{const b=el('completeCleanBtn');if(b.disabled)return;b.disabled=true;b.textContent='Completing…';try{await window.completeRecord(r.id)}finally{if(document.getElementById('completeCleanBtn')){document.getElementById('completeCleanBtn').disabled=false;document.getElementById('completeCleanBtn').textContent='Complete clean'}}};
  el('saveCleanBtn').onclick=async()=>{const b=el('saveCleanBtn');b.disabled=true;b.textContent='Saving…';try{await window.saveCleanForLater(r.id)}finally{if(document.getElementById('saveCleanBtn')){document.getElementById('saveCleanBtn').disabled=false;document.getElementById('saveCleanBtn').textContent='Save & resume later'}}};
  updateRunnerProgress();
}
async function upsertRecordItem(id,p){const old=(await api(`clean_record_items?record_id=eq.${id}&checklist_item_id=eq.${p.checklist_item_id}&limit=1`))[0];if(old)return (await api(`clean_record_items?id=eq.${old.id}`,{method:'PATCH',body:JSON.stringify(p)}))[0];return (await api('clean_record_items',{method:'POST',body:JSON.stringify(p)}))[0]}
window.saveCleanForLater=async function(id){try{if(!active||active.state.recordId!==id)throw Error('No active cleaning session.');await api(`clean_records?id=eq.${id}&status=eq.in_progress`,{method:'PATCH',body:JSON.stringify({notes:el('runNotes')?.value.trim()||null,status:'in_progress'})});for(const row of document.querySelectorAll('#runItems>.check')){const itemId=row.querySelector('[data-item]')?.dataset.item,x=active.item(itemId);if(itemId&&(x.result!=='pending'||x.note))await upsertRecordItem(id,{record_id:id,checklist_item_id:itemId,label:x.label,result:x.result,note:x.note})}await window.loadAll();window.showTab('records')}catch(e){alert(e.message)}};
window.completeRecord=async function(id){try{if(!active||active.state.recordId!==id)throw Error('No active cleaning session.');const existing=(await api(`clean_records?id=eq.${id}`))[0];if(!existing)throw Error('Cleaning record not found.');if(existing.status!=='in_progress')throw Error('This cleaning record is already completed and is locked.');active.state.generalNote=el('runNotes')?.value.trim()||'';const check=active.validation();if(!check.valid)throw Error(`Complete all ${check.pending.length} required task${check.pending.length===1?'':'s'} before finishing.`);for(const row of document.querySelectorAll('#runItems>.check')){const itemId=row.querySelector('[data-item]')?.dataset.item,x=active.item(itemId),p={record_id:id,checklist_item_id:itemId,label:x.label,result:x.result,note:x.note},saved=await upsertRecordItem(id,p);const file=row.querySelector('[data-photo]')?.files?.[0];if(file&&saved?.id&&window.VGCleanWorkflow&&!row.querySelector('[data-photo]')?.dataset.uploaded){const s=sess();await window.VGCleanWorkflow.uploadEvidence({supaUrl:U,accessToken:s?.access_token,userId:s?.user?.id,recordId:id,recordItemId:saved.id,file})}}const failed=check.failed;const teamCtx=window.VGCleanTeam?.getContext?.();const needsManagerApproval=teamCtx?.teamEnabled&&teamCtx.role==='cleaner';const nextStatus=needsManagerApproval?'pending_review':(failed.length?'flagged':'completed');if(active.assignmentId)await api('clean_assignments?id=eq.'+encodeURIComponent(active.assignmentId),{method:'PATCH',body:JSON.stringify({status:needsManagerApproval?'pending_review':(failed.length?'pending_review':'completed'),completed_at:needsManagerApproval?null:new Date().toISOString()})});const now=new Date().toISOString();await api(`clean_records?id=eq.${id}&status=eq.in_progress`,{method:'PATCH',body:JSON.stringify({status:nextStatus,completed_at:needsManagerApproval?null:now,submitted_at:needsManagerApproval?now:null,completed_by:needsManagerApproval?teamCtx.memberUserId:null,notes:active.state.generalNote||null})});for(const x of failed){const q=await api(`clean_issues?record_id=eq.${id}&title=eq.${encodeURIComponent(x.label)}&limit=1`);if(!q.length)await api('clean_issues',{method:'POST',body:JSON.stringify({user_id:uid(),record_id:id,title:x.label,description:x.note||'Checklist task failed during cleaning.',severity:'medium',status:'open'})})}await window.loadAll();if(needsManagerApproval){el('runnerBody').innerHTML='<div class="notice">Clean submitted for manager approval.</div><div class="actions"><button class="btn secondary" id="backDashboardBtn">Back to my work</button></div>';el('backDashboardBtn').onclick=()=>window.showTeamTab?.();return;}el('runnerBody').innerHTML=`<div class="notice">${failed.length?`Clean completed with ${failed.length} corrective action${failed.length===1?'':'s'} flagged.`:'Clean completed successfully.'}</div><div class="actions"><button class="btn" id="signoffBtn">Client sign-off</button><button class="btn secondary" id="viewReportBtn">View / print report</button><button class="btn secondary" id="emailReportBtn">Email report</button><button class="btn secondary" id="backDashboardBtn">Back to dashboard</button></div>`;el('signoffBtn').onclick=()=>window.openSignoffModal?.(id);el('viewReportBtn').onclick=()=>window.openReport(id);const emailBtn=el('emailReportBtn');if(emailBtn)emailBtn.onclick=()=>window.emailRecordReport?.(id);el('backDashboardBtn').onclick=()=>window.showTab('dashboard');}catch(e){alert(e.message)}};
window.openSignoffModal=function(id){const m=document.getElementById('formModal');if(!m){return}openFormModal('Client sign-off',`<div class="form"><p class="modal-copy">Confirm the client or manager who reviewed this cleaning record.</p><label>Client name<input id="signerName" autocomplete="name" placeholder="Client / manager name"></label><label>Role<input id="signerRole" autocomplete="organization-title" placeholder="e.g. Site Manager"></label><div class="modal-actions"><button class="btn secondary" type="button" onclick="window.closeFormModal()">Cancel</button><button class="btn" type="button" onclick="window.saveSignoff('${id}')">Save sign-off & view report</button></div></div>`)};
window.saveSignoff=async function(id){try{const name=el('signerName')?.value.trim();if(!name)throw Error('Enter the client name before signing off.');const userId=uid();if(!userId)throw Error('Session expired. Please sign in again.');const existing=(await api(`clean_signoffs?record_id=eq.${id}&limit=1`))[0];const p={user_id:userId,record_id:id,signer_name:name,signer_role:el('signerRole')?.value.trim()||null,signed_at:new Date().toISOString()};if(existing)await api(`clean_signoffs?id=eq.${existing.id}`,{method:'PATCH',body:JSON.stringify(p)});else await api('clean_signoffs',{method:'POST',body:JSON.stringify(p)});closeFormModal();await window.openReport(id)}catch(e){alert(e.message)}};
window.openReport=async function(id){try{const r=(await api(`clean_records?id=eq.${id}`))[0];if(!r)throw Error('Record not found');const[s,c,items,issues,signoffs,evidence]=await Promise.all([api('clean_sites?order=created_at.desc'),api('clean_checklists?order=created_at.desc'),api(`clean_record_items?record_id=eq.${id}&order=created_at.asc`),api(`clean_issues?record_id=eq.${id}&order=created_at.asc`),api(`clean_signoffs?record_id=eq.${id}&limit=1`),api(`clean_evidence?record_id=eq.${id}&select=id,record_item_id,storage_path,file_name,mime_type,captured_at&order=captured_at.asc`)]);const site=s.find(x=>x.id===r.site_id)||{},list=c.find(x=>x.id===r.checklist_id)||{},counts={};evidence.forEach(x=>counts[x.record_item_id]=(counts[x.record_item_id]||0)+1);items.forEach(x=>x.evidence_count=counts[x.id]||0);const signedEvidence=[];for(const p of evidence){try{let url=await window.VGCleanWorkflow.createSignedUrl({supaUrl:U,accessToken:sess()?.access_token,path:p.storage_path,expiresIn:7200});if(url&&!/^https?:\/\//i.test(url))url=U+url;signedEvidence.push({...p,url})}catch(_){}}const snap=window.VGCleanReport.makeReportSnapshot({companyName:'VanGuard Clean',site,checklist:list,record:r,items,issues,signoff:signoffs[0]||null,evidence:signedEvidence});const userId=uid();if(!userId)throw Error('Session expired.');const existing=(await api(`clean_report_snapshots?record_id=eq.${id}&limit=1`))[0];const reportNumber=existing?.report_number||`VC-${new Date(r.completed_at||r.created_at).toISOString().replace(/[-:TZ.]/g,'').slice(0,14)}-${id.slice(0,6).toUpperCase()}`;const p={user_id:userId,record_id:id,report_number:reportNumber,snapshot:snap};if(existing)await api(`clean_report_snapshots?id=eq.${existing.id}`,{method:'PATCH',body:JSON.stringify(p)});else await api('clean_report_snapshots',{method:'POST',body:JSON.stringify(p)});snap.report_number=reportNumber;window.VGCleanReport.renderPrintable(snap,signedEvidence)}catch(e){alert(e.message)}};
function loadReleaseUI(){if(window.VGCleanReleaseUI){window.VGCleanReleaseUI.startLifecycle?.();window.VGCleanReleaseUI.mount();return}const s=document.createElement('script');s.src='/clean/clean-release-ui.js';s.onload=()=>{window.VGCleanReleaseUI?.startLifecycle?.();window.VGCleanReleaseUI?.mount()};document.head.appendChild(s)}
window.addEventListener('load',()=>setTimeout(loadReleaseUI,0));
})();
