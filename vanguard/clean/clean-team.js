/* VanGuard Clean — team roles, assignments and manager workflow. */
(function(){
'use strict';
const U='https://qzzwkxborlmmyaukvhga.supabase.co';
const K='sb_publishable_0NmXA2uINNjhyGfZ0BCtGA_z_s2Q10z';
let ctx=null;

function session(){try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}}
function save(s){localStorage.setItem('vg_clean_session',JSON.stringify(s))}
async function raw(path,opts={}){
 const s=session(),token=s?.access_token||K;
 const r=await fetch(U+'/rest/v1/'+path,{...opts,headers:{apikey:K,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation',...(opts.headers||{})}});
 const t=await r.text();let d;try{d=t?JSON.parse(t):null}catch{d=t}
 if(!r.ok)throw Error(d?.message||d?.error_description||t||'Request failed');
 return d;
}
async function hydrate(){
 const s=session();if(!s?.access_token||!s?.user?.id)return null;
 try{
  const ms=await raw('clean_memberships?user_id=eq.'+encodeURIComponent(s.user.id)+'&active=eq.true&select=workspace_id,role,display_name&limit=1');
  if(!ms?.[0])return null;
  const m=ms[0];
  const ws=await raw('clean_workspaces?id=eq.'+encodeURIComponent(m.workspace_id)+'&select=id,owner_user_id,name&limit=1');
  if(!ws?.[0])return null;
  const ownerUserId=ws[0].owner_user_id;
  const subs=await raw('clean_subscriptions?user_id=eq.'+encodeURIComponent(ownerUserId)+'&status=in.(active,trialing,past_due,incomplete)&select=plan,status&order=updated_at.desc&limit=1');
  const plan=subs?.[0]?.plan||'free';
  ctx={workspaceId:m.workspace_id,role:m.role,displayName:m.display_name||'',memberUserId:s.user.id,ownerUserId,workspaceName:ws[0].name||'Workspace',plan,teamEnabled:['business','pro'].includes(plan)};
  s.cleanContext=ctx;save(s);
  return ctx;
 }catch(e){console.warn('Clean team context unavailable',e);return null}
}
function isTeam(){return !!ctx?.teamEnabled}
function isManager(){return !!ctx?.teamEnabled&&['owner','admin'].includes(ctx.role)}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function statusLabel(s){return ({assigned:'Assigned',in_progress:'In progress',pending_review:'Awaiting approval',changes_required:'Changes requested',completed:'Completed',cancelled:'Cancelled'})[s]||s}
function statusClass(s){return s==='completed'?'ok':(['pending_review','changes_required'].includes(s)?'warn':'')}
function dateText(v){return v?new Date(v).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'No due date'}

function ensureTeamTab(){
 const tabs=document.querySelector('.tabs');if(!tabs||document.getElementById('teamTab'))return;
 const b=document.createElement('button');b.className='tab';b.dataset.tab='team';b.id='teamTab';b.textContent=isTeam()?(isManager()?'Team':'My work'):'Team';if(!isTeam()){b.classList.add('locked');b.title='Upgrade to Business or Pro to unlock team tools';b.onclick=()=>window.showTeamUpgrade?.();}else b.onclick=()=>window.showTeamTab?.();
 tabs.appendChild(b);
 const host=document.querySelector('main')||document.getElementById('app');
 if(host&&!document.getElementById('team')){
  const page=document.createElement('section');page.id='team';page.className='tabpage hidden';
  page.innerHTML='<div class="card" id="teamPanel"><div class="loading-state">Loading team workspace…</div></div>';
  host.appendChild(page);
 }
}
function hideForCleaner(){
 if(!ctx||ctx.role!=='cleaner')return;
 document.querySelectorAll('.tabs .tab').forEach(b=>{if(!['dashboard','records','team'].includes(b.dataset.tab))b.classList.add('hidden')});
 const title=document.getElementById('pageTitle'),sub=document.getElementById('subTitle');
 if(title)title.textContent='My cleaning work';
 if(sub)sub.textContent='Complete assigned cleans and submit them for manager approval.';
}
async function getTeamData(){
 const [members,assignments,sites,lists,pending]=await Promise.all([
  raw('clean_memberships?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&active=eq.true&order=role.asc,created_at.asc'),
  raw('clean_assignments?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&status=neq.cancelled&order=due_at.asc,created_at.desc&limit=100'),
  raw('clean_sites?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&active=eq.true&order=site_name.asc'),
  raw('clean_checklists?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&active=eq.true&order=name.asc'),
  raw('clean_records?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&status=eq.pending_review&order=submitted_at.desc&limit=50')
 ]);
 return {members,assignments,sites,lists,pending};
}
async function loadTeam(){
 const panel=document.getElementById('teamPanel');if(!panel||!ctx)return;
 try{
  if(!ctx.teamEnabled){
   panel.innerHTML='<div class="eyebrow">Team workflow</div><h2>Business & Pro</h2><p class="modal-copy">Team logins, assignments and manager approval are available on Business and Pro.</p>';
   return;
  }
  const d=await getTeamData();
  if(!isManager()){
   const mine=d.assignments.filter(a=>a.cleaner_id===ctx.memberUserId&&a.status!=='completed'&&a.status!=='cancelled');
   const siteMap=Object.fromEntries(d.sites.map(x=>[x.id,x.site_name])),listMap=Object.fromEntries(d.lists.map(x=>[x.id,x.name]));
   const rows=mine.map(a=>'<div class="row"><div><strong>'+esc(siteMap[a.site_id]||'Site')+' · '+esc(listMap[a.checklist_id]||'Checklist')+'</strong><small>'+esc(statusLabel(a.status))+' · Due '+esc(dateText(a.due_at))+(a.notes?' · '+esc(a.notes):'')+'</small></div><div class="actions"><button class="btn" type="button" onclick="window.startAssignedClean(\''+a.id+'\')">'+(a.status==='assigned'||a.status==='changes_required'?'Start':'Resume')+'</button></div></div>').join('')||'<div class="empty">No assigned cleans. Your manager can assign work here.</div>';
   panel.innerHTML='<div class="eyebrow">Cleaner</div><h2>My work</h2><p class="modal-copy">Your assigned cleans appear here. Complete them and submit for manager approval.</p><div class="section"><h3>Assigned cleans</h3><div class="list">'+rows+'</div></div>';
   return;
  }
  const memberMap=Object.fromEntries(d.members.map(m=>[m.user_id,m.display_name||'Team member']));
  const siteMap=Object.fromEntries(d.sites.map(x=>[x.id,x.site_name]));
  const listMap=Object.fromEntries(d.lists.map(x=>[x.id,x.name]));
  const pendingRows=d.pending.map(r=>{
   const who=memberMap[r.created_by||r.user_id]||'Cleaner';
   return '<div class="row"><div><strong>'+esc(siteMap[r.site_id]||'Site')+' · '+esc(listMap[r.checklist_id]||'Cleaning checklist')+'</strong><small>'+esc(who)+' · Submitted '+esc(dateText(r.submitted_at||r.created_at))+'</small></div><div class="actions"><button class="btn" type="button" onclick="window.reviewClean(\''+r.id+'\',\'approved\')">Approve</button><button class="btn secondary" type="button" onclick="window.reviewClean(\''+r.id+'\',\'changes_required\')">Request changes</button></div></div>';
  }).join('')||'<div class="empty">No cleans waiting for approval.</div>';
  const assignmentRows=d.assignments.slice(0,30).map(a=>{
   const status=a.status==='completed'?'Completed':statusLabel(a.status);
   return '<div class="row"><div><strong>'+esc(siteMap[a.site_id]||'Site')+' · '+esc(listMap[a.checklist_id]||'Checklist')+'</strong><small>'+esc(memberMap[a.cleaner_id]||'Cleaner')+' · '+esc(status)+' · '+esc(dateText(a.due_at))+'</small></div><button class="btn secondary" type="button" onclick="window.cancelAssignment(\''+a.id+'\')">Cancel</button></div>';
  }).join('')||'<div class="empty">No assignments yet.</div>';
  const memberRows=d.members.map(m=>'<div class="row"><div><strong>'+esc(m.display_name||'Team member')+'</strong><small>'+esc(m.role)+'</small></div><span class="badge">'+(m.active?'Active':'Inactive')+'</span></div>').join('');
  panel.innerHTML='<div class="eyebrow">Workspace</div><h2>'+esc(ctx.workspaceName)+'</h2><div class="stats" style="margin-top:14px"><div class="stat"><b>'+d.pending.length+'</b><small>Awaiting approval</small></div><div class="stat"><b>'+d.assignments.filter(a=>a.status!=='completed').length+'</b><small>Open assignments</small></div><div class="stat"><b>'+d.members.length+'</b><small>Team members</small></div><div class="stat"><b>'+d.sites.length+'</b><small>Sites</small></div></div><div class="section"><h3>Assign a clean</h3><p class="modal-copy">Choose a site, checklist, cleaner and due date.</p><div class="actions"><button class="btn" type="button" onclick="window.openAssignmentForm()">+ Assign clean</button></div></div><div class="section"><h3>Pending approval</h3><div class="list">'+pendingRows+'</div></div><div class="section"><h3>Assignments</h3><div class="list">'+assignmentRows+'</div></div><div class="section"><h3>Team</h3><div class="actions" style="margin-bottom:10px"><button class="btn" type="button" onclick="window.inviteCleanMember()">+ Add team member</button></div><div class="list">'+memberRows+'</div></div>';
 }catch(e){panel.innerHTML='<div class="notice">'+esc(e.message||'Could not load the team.')+'</div>'}
}
window.openAssignmentForm=async function(){
 if(!isManager())return;
 try{
  const d=await getTeamData();
  const cleaners=d.members.filter(m=>m.active&&['cleaner','admin'].includes(m.role));
  if(!cleaners.length)throw Error('Add a cleaner or admin first, then assign a clean.');
  if(!d.sites.length)throw Error('Add a site first.');
  if(!d.lists.length)throw Error('Add a checklist first.');
  const siteOptions=d.sites.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.customer_name)+' — '+esc(x.site_name)+'</option>').join('');
  const listOptions=d.lists.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
  const cleanerOptions=cleaners.map(x=>'<option value="'+esc(x.user_id)+'">'+esc(x.display_name||'Team member')+' ('+esc(x.role)+')</option>').join('');
  const today=new Date();today.setHours(17,0,0,0);
  const due=today.toISOString().slice(0,16);
  window.openFormModal('Assign cleaning', '<div class="form"><label>Site<select id="assignSite">'+siteOptions+'</select></label><label>Checklist<select id="assignChecklist">'+listOptions+'</select></label><label>Cleaner<select id="assignCleaner">'+cleanerOptions+'</select></label><label>Due date & time<input id="assignDue" type="datetime-local" value="'+due+'"></label><label>Instructions / notes<textarea id="assignNotes" placeholder="Optional instructions for the cleaner"></textarea></label><div class="modal-actions"><button class="btn secondary" type="button" onclick="window.closeFormModal()">Cancel</button><button class="btn" type="button" id="saveAssignmentBtn">Assign clean</button></div></div>');
  document.getElementById('saveAssignmentBtn').onclick=async()=>{
   const b=document.getElementById('saveAssignmentBtn');b.disabled=true;b.textContent='Assigning…';
   try{
    const s=session();const dueValue=document.getElementById('assignDue')?.value;
    await raw('clean_assignments',{method:'POST',body:JSON.stringify({workspace_id:ctx.workspaceId,site_id:document.getElementById('assignSite').value,checklist_id:document.getElementById('assignChecklist').value,cleaner_id:document.getElementById('assignCleaner').value,created_by:s.user.id,due_at:dueValue?new Date(dueValue).toISOString():null,notes:document.getElementById('assignNotes').value.trim()||null})});
    window.closeFormModal();await loadTeam();
   }catch(e){alert(e.message||'Could not assign the clean.');b.disabled=false;b.textContent='Assign clean'}
  };
 }catch(e){alert(e.message||'Could not open assignment form.')}
};
window.cancelAssignment=async function(id){
 if(!isManager()||!confirm('Cancel this assignment?'))return;
 try{await raw('clean_assignments?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'cancelled'})});await loadTeam()}catch(e){alert(e.message||'Could not cancel assignment.')}
};
window.startAssignedClean=async function(id){
 if(!ctx)return;
 try{
  const a=(await raw('clean_assignments?id=eq.'+encodeURIComponent(id)+'&limit=1'))?.[0];
  if(!a)throw Error('Assignment not found.');
  const data=await window.loadAll();
  await window.openCleanStartModal(data.sites,data.checklists,a.site_id,a.checklist_id,ctx.displayName||'');
  const hidden=document.createElement('input');hidden.type='hidden';hidden.id='assignmentId';hidden.value=a.id;document.getElementById('formModalBody')?.appendChild(hidden);
 }catch(e){alert(e.message||'Could not open assigned clean.')}
};
window.showTeamUpgrade=async function(){
 ensureTeamTab();
 document.querySelectorAll('.tabpage').forEach(x=>x.classList.add('hidden'));
 document.getElementById('team')?.classList.remove('hidden');
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='team'));
 document.getElementById('pageTitle').textContent='Team tools';
 document.getElementById('subTitle').textContent='Upgrade to unlock cleaners, assignments and manager approvals.';
 const panel=document.getElementById('teamPanel');
 if(panel){
  panel.innerHTML='<div class="eyebrow">Upgrade</div><h2>Team management is locked</h2><p class="modal-copy">Business and Pro add admin logins, cleaner accounts, job assignments and manager approval. Your current plan keeps the core cleaning tools available for a single login.</p><div id="teamUpgradeChoices"></div>';
  window.VGCleanSubscription?.renderPlans?.('teamUpgradeChoices');
 }
};
window.showTeamTab=async function(){
 ensureTeamTab();document.querySelectorAll('.tabpage').forEach(x=>x.classList.add('hidden'));document.getElementById('team')?.classList.remove('hidden');
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='team'));
 document.getElementById('pageTitle').textContent=isManager()?'Team & approvals':'My work';
 document.getElementById('subTitle').textContent=isManager()?'Assign cleans, manage your team and approve submissions.':'Complete assigned cleans and submit them for approval.';
 await loadTeam();
};
window.inviteCleanMember=async function(){
 if(!isManager())return;
 const email=prompt('Team member email address');if(!email)return;
 const name=prompt('Team member name');if(!name)return;
 const role=confirm('Make this person an admin?\n\nOK = Admin\nCancel = Cleaner')?'admin':'cleaner';
 try{
  const s=session();const r=await fetch('/.netlify/functions/clean-team',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token},body:JSON.stringify({email,display_name:name,role})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Could not invite team member.');
  alert('Invitation sent to '+d.email+'. They can create their password from the email.');
  await loadTeam();
 }catch(e){alert(e.message||'Could not invite team member.')}
};
window.reviewClean=async function(recordId,decision){
 if(!isManager())return;
 const notes=decision==='changes_required'?prompt('What needs changing?')||'Changes requested.':'';
 try{
  const s=session();
  await raw('clean_reviews',{method:'POST',body:JSON.stringify({workspace_id:ctx.workspaceId,record_id:recordId,reviewer_id:s.user.id,decision,notes})});
  const patch=decision==='approved'?{status:'completed',reviewed_by:s.user.id,reviewed_at:new Date().toISOString(),review_notes:notes||null,completed_at:new Date().toISOString()}:{status:'changes_required',reviewed_by:s.user.id,reviewed_at:new Date().toISOString(),review_notes:notes||null};
  await raw('clean_records?id=eq.'+encodeURIComponent(recordId),{method:'PATCH',body:JSON.stringify(patch)});
  alert(decision==='approved'?'Clean approved.':'Changes requested.');await loadTeam();if(window.loadAll)await window.loadAll();
 }catch(e){alert(e.message||'Could not review the clean.')}
};
async function initialise(){const c=await hydrate();if(!c)return;ensureTeamTab();hideForCleaner();if(c.teamEnabled&&isManager()&&document.getElementById('teamPanel'))loadTeam();}
window.VGCleanTeam={hydrate,getContext:()=>ctx,isManager,isTeam};
window.addEventListener('load',()=>setTimeout(initialise,50));
})();