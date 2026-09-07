/* VanGuard Clean — release UI: activation, subscription status and billing CTA. */
(function(){'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function getSession(){try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}}
const plans={starter:'Starter',business:'Business',pro:'Pro'};
let observerStarted=false;
async function loadSubscription(){
 const el=document.getElementById('cleanReleasePanel'),s=getSession();if(!el||!s?.user?.id||!window.api)return;
 try{
  const rows=await window.api(`clean_subscriptions?user_id=eq.${encodeURIComponent(s.user.id)}&order=updated_at.desc&limit=1`),sub=rows?.[0];
  if(!sub){
   el.innerHTML='<div class="card"><strong>Start your 14-day free trial</strong><p style="margin:6px 0 12px;color:#64748b">Your card is required at signup, but you will not be charged until the trial ends.</p><div id="cleanPlanChoices"></div></div>';
   if(window.VGCleanSubscription?.renderPlans)window.VGCleanSubscription.renderPlans('cleanPlanChoices',{email:s.user.email||'',userId:s.user.id});
   return;
  }
  const end=sub.trial_end?new Date(sub.trial_end):null,days=end?Math.max(0,Math.ceil((end-Date.now())/86400000)):null;
  const status=sub.status==='trialing'?`Trial: ${days} day${days===1?'':'s'} remaining`:sub.status==='active'?'Active subscription':String(sub.status||'').replaceAll('_',' ');
  const tone=sub.status==='trialing'?'Trial':sub.status==='active'?'Active':'Billing status';
  el.innerHTML=`<div class="card"><div class="row"><div><strong>${esc(plans[sub.plan]||'Business')} plan</strong><small>${esc(status)}${sub.cancel_at_period_end?' · Cancels at period end':''}</small></div><span class="badge">${esc(sub.billing_interval||'month')}</span></div><small style="display:block;margin-top:8px;color:#64748b">${esc(tone)} · Manage your plan from your billing provider.</small></div>`;
 }catch(_){el.innerHTML='<div class="notice">Subscription status is temporarily unavailable. Your account and existing records are unchanged.</div>';}
}
function mount(){
 const app=document.getElementById('app');if(!app||document.getElementById('cleanReleasePanel'))return;
 const hero=app.querySelector('main .hero');if(hero){const panel=document.createElement('div');panel.id='cleanReleasePanel';panel.style.marginBottom='16px';hero.after(panel);loadSubscription();}
}
function startLifecycle(){if(observerStarted)return;observerStarted=true;const app=document.getElementById('app');if(!app)return;
 const tick=()=>mount();tick();
 const mo=new MutationObserver(tick);mo.observe(app,{attributes:true,childList:true,subtree:true});
 setTimeout(()=>{try{mo.disconnect()}catch(_){ }},120000);
}
window.VGCleanReleaseUI={mount,loadSubscription,startLifecycle};
})();
