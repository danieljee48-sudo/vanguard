/* VanGuard Clean — subscription status and billing CTA. */
(function(){'use strict';
const plans={starter:'Starter',business:'Business',pro:'Pro'};
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function getSession(){try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}}
async function loadSubscription(){
 const el=document.getElementById('cleanReleasePanel'),s=getSession();if(!el||!s?.user?.id||!window.api)return;
 try{
  const team=window.VGCleanTeam;
  const ctx=team?.getContext?.() || (await team?.hydrate?.());
  const ownerUserId=ctx?.ownerUserId||s.user.id;
  const role=ctx?.role||'owner';
  const rows=await window.api('clean_subscriptions?user_id=eq.'+encodeURIComponent(ownerUserId)+'&order=updated_at.desc&limit=1');
  const sub=rows?.[0];
  if(!sub){
   if(role!=='owner'){
    el.innerHTML='<div class="card"><strong>Team access</strong><p style="margin:6px 0;color:#64748b">Your workspace is on a team plan, but billing is managed by the workspace owner.</p></div>';
    return;
   }
   el.innerHTML='<div class="card"><strong>Free forever for 1 site</strong><p style="margin:6px 0 12px;color:#64748b">No card required. Upgrade when you need more sites or team logins.</p><div id="cleanPlanChoices"></div></div>';
   if(window.VGCleanSubscription?.renderPlans)window.VGCleanSubscription.renderPlans('cleanPlanChoices');
   return;
  }
  const status=sub.status==='active'?'Active subscription':String(sub.status||'').replaceAll('_',' ');
  const manage=role==='owner'?'<div class="actions" style="margin-top:12px"><button class="btn secondary" id="cleanManageBilling">Manage billing</button></div><small style="display:block;margin-top:8px;color:#64748b">Update payment details, invoices or cancellation in Stripe.</small>':'<small style="display:block;margin-top:10px;color:#64748b">Billing is managed by the workspace owner.</small>';
  el.innerHTML='<div class="card"><div class="row"><div><strong>'+esc(plans[sub.plan]||'Business')+' plan</strong><small>'+esc(status)+(sub.cancel_at_period_end?' · Cancels at period end':'')+'</small></div><span class="badge">'+esc(sub.billing_interval||'month')+'</span></div>'+manage+'</div>';
  const button=document.getElementById('cleanManageBilling');
  if(button)button.onclick=async()=>{button.disabled=true;button.textContent='Opening…';try{await window.VGCleanSubscription?.openBillingPortal()}catch(e){alert(e.message||'Unable to open billing portal');button.disabled=false;button.textContent='Manage billing'}};
 }catch(e){el.innerHTML='<div class="notice">Subscription status is temporarily unavailable. Your account and existing records are unchanged.</div>';}
}
function mount(){const app=document.getElementById('app');if(!app||document.getElementById('cleanReleasePanel'))return;const hero=app.querySelector('main .hero');if(hero){const panel=document.createElement('div');panel.id='cleanReleasePanel';panel.style.marginBottom='16px';hero.after(panel);loadSubscription();}}
let observerStarted=false;
function startLifecycle(){if(observerStarted)return;observerStarted=true;const app=document.getElementById('app');if(!app)return;const tick=()=>mount();tick();const mo=new MutationObserver(tick);mo.observe(app,{attributes:true,childList:true,subtree:true});setTimeout(()=>{try{mo.disconnect()}catch(_){ }},120000);}
window.VGCleanReleaseUI={mount,loadSubscription,startLifecycle};
})();