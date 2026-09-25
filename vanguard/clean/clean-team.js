/* VanGuard Clean — team roles and manager workflow.
 * Business/Pro only.
 */
(function(){
'use strict';
const U='https://qzzwkxborlmmyaukvhga.supabase.co';
const K='sb_publishable_0NmXA2uINNjhyGfZ0BCtGA_z_s2Q10z';
let ctx=null, originalCompleteRecord=null, bootPatched=false;

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
  ctx={
   workspaceId:m.workspace_id,
   role:m.role,
   displayName:m.display_name||'',
   memberUserId:s.user.id,
   ownerUserId,
   workspaceName:ws[0].name||'Workspace',
   plan,
   teamEnabled:['business','pro'].includes(plan)
  };
  s.cleanContext=ctx;save(s);
  return ctx;
 }catch(e){console.warn('Clean team context unavailable',e);return null}
}
function isTeam(){return !!ctx&&ctx.teamEnabled}
function isManager(){return !!ctx&&ctx.teamEnabled&&['owner','admin'].includes(ctx.role)}
function isOwner(){return !!ctx&&ctx.role==='owner'}
function ensureTeamTab(){
 const tabs=document.querySelector('.tabs');if(!tabs||!isTeam()||document.getElementById('teamTab'))return;
 const b=document.createElement('button');b.className='tab';b.dataset.tab='team';b.id='teamTab';
 b.textContent=isManager()?'Team':'My work';b.onclick=()=>window.showTeamTab?.();
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
 document.querySelectorAll('.tabs .tab').forEach(b=>{
   const allowed=['dashboard','records','team'];
   if(!allowed.includes(b.dataset.tab))b.classList.add('hidden');
 });
 const start=document.querySelector('.hero .btn');
 if(start){start.textContent='Start assigned clean';}
 const title=document.getElementById('pageTitle'),sub=document.getElementById('subTitle');
 if(title)title.textContent='My cleaning work';
 if(sub)sub.textContent='Complete your cleaning records and submit them for manager approval.';
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function statusLabel(s){
 return ({in_progress:'In progress',pending_review:'Awaiting approval',changes_required:'Changes requested',completed:'Approved',flagged:'Flagged'})[s]||s;
}
function statusClass(s){return s==='completed'?'ok':(['pending_review','changes_required','flagged'].includes(s)?'warn':'')}
async function loadTeam(){
 const panel=document.getElementById('teamPanel');if(!panel||!ctx)return;
 try{
  if(!ctx.teamEnabled){
   panel.innerHTML='<div class="eyebrow">Team workflow</div><h2>Business & Pro</h2><p class="modal-copy">Team logins, cleaner submissions and manager approval are available on Business and Pro.</p><div class="actions"><button class="btn" type="button" onclick="window.VGCleanSubscription?.renderPlans('teamUpgradeChoices')">View plans</button></div><div id="teamUpgradeChoices"></div>';
   return;
  }
  if(!isManager()){
   const mine=await raw('clean_records?created_by=eq.'+encodeURIComponent(ctx.memberUserId)+'&order=created_at.desc&limit=20');
   const rows=mine.map(r=>'<div class="row"><div><strong>'+esc(r.checklist_id?'Cleaning record':'Cleaning')+'</strong><small>'+new Date(r.created_at).toLocaleString('en-GB')+'</small></div><span class="status-pill '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</span></div>').join('')||'<div class="empty">No cleaning records yet. Start a clean to see your work here.</div>';
   panel.innerHTML='<div class="eyebrow">Cleaner</div><h2>My work</h2><p class="modal-copy">Submit completed cleans for manager approval. If changes are requested, update the record and submit it again.</p><div class="section"><h3>Recent work</h3><div class="list">'+rows+'</div></div>';
   return;
  }
  const [members,pending,sites,lists]=await Promise.all([
   raw('clean_memberships?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&active=eq.true&order=role.asc,created_at.asc'),
   raw('clean_records?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&status=eq.pending_review&order=submitted_at.desc&limit=50'),
   raw('clean_sites?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&order=site_name.asc'),
   raw('clean_checklists?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&order=name.asc')
  ]);
  const memberMap=Object.fromEntries(members.map(m=>[m.user_id,m.display_name||'Team member']));
  const siteMap=Object.fromEntries(sites.map(x=>[x.id,x.site_name]));
  const listMap=Object.fromEntries(lists.map(x=>[x.id,x.name]));
  const memberRows=members.map(m=>'<div class="row"><div><strong>'+esc(m.display_name||'Team member')+'</strong><small>'+esc(m.role)+' · '+esc(m.user_id)+'</small></div><span class="badge">'+(m.active?'Active':'Inactive')+'</span></div>').join('')||'<div class="empty">No team members yet.</div>';
  const pendingRows=pending.map(r=>{
   const who=memberMap[r.created_by||r.user_id]||'Cleaner';
   const site=siteMap[r.site_id]||'Site';
   const list=listMap[r.checklist_id]||'Cleaning checklist';
   return '<div class="row"><div><strong>'+esc(site)+' · '+esc(list)+'</strong><small>'+esc(who)+' · '+new Date(r.submitted_at||r.created_at).toLocaleString('en-GB')+'</small></div><div class="actions"><button class="btn" type="button" onclick="window.reviewClean(\''+r.id+'\',\'approved\')">Approve</button><button class="btn secondary" type="button" onclick="window.reviewClean(\''+r.id+'\',\'changes_required\')">Request changes</button></div></div>';
  }).join('')||'<div class="empty">No cleans waiting for approval.</div>';
  panel.innerHTML='<div class="eyebrow">Workspace</div><h2>'+esc(ctx.workspaceName)+'</h2><div class="stats" style="margin-top:14px"><div class="stat"><b>'+pending.length+'</b><small>Awaiting approval</small></div><div class="stat"><b>'+members.length+'</b><small>Team members</small></div><div class="stat"><b>'+sites.length+'</b><small>Sites</small></div><div class="stat"><b>'+lists.length+'</b><small>Checklists</small></div></div><div class="section"><h3>Pending approval</h3><div class="list">'+pendingRows+'</div></div><div class="section"><h3>Team</h3><div class="actions" style="margin-bottom:10px"><button class="btn" type="button" onclick="window.inviteCleanMember()">+ Add team member</button></div><div class="list">'+memberRows+'</div></div>';
 }catch(e){panel.innerHTML='<div class="notice">'+esc(e.message||'Could not load the team.')+'</div>'}
}
window.showTeamTab=async function(){
 ensureTeamTab();document.querySelectorAll('.tabpage').forEach(x=>x.classList.add('hidden'));
 document.getElementById('team')?.classList.remove('hidden');
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='team'));
 document.getElementById('pageTitle').textContent=isManager()?'Team & approvals':'My work';
 document.getElementById('subTitle').textContent=isManager()?'Manage your team and approve submitted cleans.':'Complete your assigned cleans and submit them for approval.';
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
  const patch=decision==='approved'
   ? {status:'completed',reviewed_by:s.user.id,reviewed_at:new Date().toISOString(),review_notes:notes||null,completed_at:new Date().toISOString()}
   : {status:'changes_required',reviewed_by:s.user.id,reviewed_at:new Date().toISOString(),review_notes:notes||null};
  await raw('clean_records?id=eq.'+encodeURIComponent(recordId),{method:'PATCH',body:JSON.stringify(patch)});
  alert(decision==='approved'?'Clean approved.':'Changes requested.');
  await loadTeam();if(window.loadAll)await window.loadAll();
 }catch(e){alert(e.message||'Could not review the clean.')}
};
function patchCompletion(){
 if(bootPatched||!ctx||ctx.role!=='cleaner'||!window.completeRecord)return;
 if(!originalCompleteRecord)originalCompleteRecord=window.completeRecord;
 bootPatched=true;
 window.completeRecord=async function(id){
   await originalCompleteRecord(id);
   try{
     await raw('clean_records?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'pending_review',submitted_at:new Date().toISOString(),completed_by:ctx.memberUserId,reviewed_by:null,reviewed_at:null,review_notes:null,completed_at:null})});
     const body=document.getElementById('runnerBody');
     if(body)body.innerHTML='<div class="notice">Clean submitted for manager approval.</div><div class="actions"><button class="btn secondary" type="button" onclick="window.showTab(\'records\')">Back to records</button></div>';
     await window.loadAll?.();
   }catch(e){alert(e.message||'Could not submit the clean for review.')}
 };
}
async function initialise(){
 const c=await hydrate();
 if(!c)return;
 ensureTeamTab();hideForCleaner();
 if(window.boot&&!bootPatched&&c.role==='cleaner'){
   // Core boot is explicitly hydrated before loadAll; we only need to wrap completion.
   patchCompletion();
 }
 if(c.teamEnabled&&isManager()&&document.getElementById('teamPanel'))loadTeam();
}
window.VGCleanTeam={hydrate,getContext:()=>ctx,isManager,isOwner,isTeam};
window.addEventListener('load',()=>setTimeout(initialise,50));
})();