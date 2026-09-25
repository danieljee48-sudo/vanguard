/* VanGuard Clean — team roles and manager workflow.
 * Loaded after the core Clean workflow. Business/Pro only.
 */
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
 if(!r.ok)throw Error(d?.message||d?.error_description||t||'Request failed');return d;
}
async function hydrate(){
 const s=session();if(!s?.access_token||!s?.user?.id)return null;
 try{
  const ms=await raw('clean_memberships?user_id=eq.'+encodeURIComponent(s.user.id)+'&active=eq.true&select=workspace_id,role,display_name&limit=1');
  if(!ms?.[0])return null;
  const m=ms[0];
  const ws=await raw('clean_workspaces?id=eq.'+encodeURIComponent(m.workspace_id)+'&select=id,owner_user_id,name&limit=1');
  if(!ws?.[0])return null;
  ctx={workspaceId:m.workspace_id,role:m.role,displayName:m.display_name||'',ownerUserId:ws[0].owner_user_id,workspaceName:ws[0].name||'Workspace'};
  s.cleanContext=ctx;
  /* The existing MVP queries filter by user_id. For team members, point that
     compatibility filter at the workspace owner while the JWT remains the cleaner. */
  save(s);
  return ctx;
 }catch(e){console.warn('Clean team context unavailable',e);return null}
}
function isTeam(){return !!ctx&&['admin','cleaner'].includes(ctx.role)}
function isManager(){return !!ctx&&ctx.teamEnabled&&['owner','admin'].includes(ctx.role)}
function ensureTeamTab(){
 const tabs=document.querySelector('.tabs');if(!tabs||!isTeam()||document.getElementById('teamTab'))return;
 const b=document.createElement('button');b.className='tab';b.dataset.tab='team';b.id='teamTab';b.textContent=isManager()?'Team':'My work';
 b.onclick=()=>window.showTeamTab?.();
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
 if(sub)sub.textContent='Complete assigned cleaning records and submit them for manager approval.';
}
async function loadTeam(){
 const panel=document.getElementById('teamPanel');if(!panel||!ctx)return;
 try{
  const members=await raw('clean_memberships?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&active=eq.true&order=role.asc,created_at.asc');
  const pending=await raw('clean_records?workspace_id=eq.'+encodeURIComponent(ctx.workspaceId)+'&status=eq.pending_review&order=submitted_at.desc&limit=50');
  if(!isManager()){
   panel.innerHTML='<div class="eyebrow">Cleaner</div><h2>My work</h2><p class="modal-copy">Your cleans appear in Records. When you submit one, your manager will review it here.</p>';
   return;
  }
  const memberRows=members.map(m=>'<div class="row"><div><strong>'+esc(m.display_name||'Team member')+'</strong><small>'+esc(m.role)+' · '+esc(m.user_id)+'</small></div></div>').join('')||'<div class="empty">No team members yet.</div>';
  const pendingRows=pending.map(r=>'<div class="row"><div><strong>Cleaning record</strong><small>'+new Date(r.submitted_at||r.created_at).toLocaleString('en-GB')+' · '+esc(r.cleaner_name||'Cleaner')+'</small></div><div class="actions"><button class="btn" type="button" onclick="window.reviewClean(\''+r.id+'\',\'approved\')">Approve</button><button class="btn secondary" type="button" onclick="window.reviewClean(\''+r.id+'\',\'changes_required\')">Request changes</button></div></div>').join('')||'<div class="empty">No cleans waiting for approval.</div>';
  panel.innerHTML='<div class="eyebrow">Workspace</div><h2>'+esc(ctx.workspaceName)+'</h2><div class="section"><h3>Pending approval</h3><div class="list">'+pendingRows+'</div></div><div class="section"><h3>Team</h3><div class="actions" style="margin-bottom:10px"><button class="btn" type="button" onclick="window.inviteCleanMember()">+ Add team member</button></div><div class="list">'+memberRows+'</div></div>';
 }catch(e){panel.innerHTML='<div class="notice">'+esc(e.message||'Could not load the team.')+'</div>'}
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
window.showTeamTab=async function(){ensureTeamTab();document.querySelectorAll('.tabpage').forEach(x=>x.classList.add('hidden'));document.getElementById('team')?.classList.remove('hidden');document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='team'));document.getElementById('pageTitle').textContent=isManager()?'Team & approvals':'My work';document.getElementById('subTitle').textContent=isManager()?'Manage your team and approve submitted cleans.':'Complete your assigned cleans and submit them for approval.';await loadTeam()};
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
   ? {status:'completed',reviewed_by:ctx.memberUserId,reviewed_at:new Date().toISOString(),review_notes:notes||null,completed_at:new Date().toISOString()}
   : {status:'changes_required',reviewed_by:s.user.id,reviewed_at:new Date().toISOString(),review_notes:notes||null};
  await raw('clean_records?id=eq.'+encodeURIComponent(recordId),{method:'PATCH',body:JSON.stringify(patch)});
  alert(decision==='approved'?'Clean approved.':'Changes requested.');
  await loadTeam();if(window.loadAll)await window.loadAll();
 }catch(e){alert(e.message||'Could not review the clean.')}
};
function patchCompletion(){
 if(!ctx||ctx.role!=='cleaner'||!window.completeRecord||originalCompleteRecord)return;
 originalCompleteRecord=window.completeRecord;
 window.completeRecord=async function(id){
   await originalCompleteRecord(id);
   try{
     await raw('clean_records?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'pending_review',submitted_at:new Date().toISOString(),completed_by:ctx.memberUserId,reviewed_by:null,reviewed_at:null,review_notes:null,completed_at:null})});
     const body=document.getElementById('runnerBody');
     if(body)body.innerHTML='<div class="notice">Clean submitted for manager approval.</div><div class="actions"><button class="btn secondary" type="button" onclick="window.showTab(\\'records\\')">Back to records</button></div>';
     await window.loadAll?.();
   }catch(e){alert(e.message||'Could not submit the clean for review.')}
 };
}
const originalBoot=window.boot;
if(originalBoot){
 window.boot=async function(){
   await hydrate();
   const result=await originalBoot.apply(this,arguments);
   ensureTeamTab();hideForCleaner();patchCompletion();
   return result;
 };
}
window.addEventListener('load',function(){
 setTimeout(async()=>{
   await hydrate();
   ensureTeamTab();hideForCleaner();patchCompletion();
   if(ctx&&isManager()&&document.getElementById('teamPanel'))loadTeam();
 },50);
});
window.VGCleanTeam={hydrate,getContext:()=>ctx,isManager,isTeam};
})();