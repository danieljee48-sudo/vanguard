/* VanGuard Clean — release UI: onboarding, trial status, plans and demo entry. */
(function(){'use strict';
const sub=window.VGCleanSubscription;
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function loadSubscription(){
  const el=document.getElementById('cleanReleasePanel'); if(!el||!window.session?.user?.id)return;
  try{
    const rows=await window.api(`clean_subscriptions?user_id=eq.${window.session.user.id}&limit=1`);
    const s=rows?.[0];
    if(!s){el.innerHTML='<div class="notice"><b>14-day free trial</b><br>Choose a plan to start your trial. Your card is required at signup and you will not be charged until the trial ends.</div>'; return;}
    const end=s.trial_end?new Date(s.trial_end):null;
    const days=end?Math.max(0,Math.ceil((end-Date.now())/86400000)):null;
    const label=s.status==='trialing'?`Trial: ${days} day${days===1?'':'s'} remaining`:s.status==='active'?'Active subscription':s.status.replaceAll('_',' ');
    el.innerHTML=`<div class="row"><div><strong>${esc(sub?.PLANS?.[s.plan]?.name||s.plan||'Business')} plan</strong><small>${esc(label)}${s.cancel_at_period_end?' · Cancels at period end':''}</small></div><span class="badge">${esc(s.billing_interval||'month')}</span></div>`;
  }catch(e){el.innerHTML='<div class="notice">Billing status will appear once your subscription is connected.</div>';}
}
function mount(){
  const app=document.getElementById('app'); if(!app||document.getElementById('cleanReleasePanel'))return;
  const hero=app.querySelector('main .hero');
  if(hero){const panel=document.createElement('div');panel.id='cleanReleasePanel';panel.style.marginBottom='16px';hero.after(panel);}
  loadSubscription();
}
window.VGCleanReleaseUI={mount,loadSubscription};
})();
