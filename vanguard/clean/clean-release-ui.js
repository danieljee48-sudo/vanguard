/* VanGuard Clean — release UI: activation and subscription status. */
(function(){'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function getSession(){try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}}
const plans={starter:'Starter',business:'Business',pro:'Pro'};
async function loadSubscription(){
 const el=document.getElementById('cleanReleasePanel'),s=getSession(); if(!el||!s?.user?.id||!window.api)return;
 try{const rows=await window.api(`clean_subscriptions?user_id=eq.${s.user.id}&limit=1`),sub=rows?.[0];
  if(!sub){el.innerHTML='<div class="notice"><b>Start your 14-day free trial</b><br>Your card is required at signup, but you will not be charged until the trial ends.</div>';return;}
  const end=sub.trial_end?new Date(sub.trial_end):null,days=end?Math.max(0,Math.ceil((end-Date.now())/86400000)):null;
  const status=sub.status==='trialing'?`Trial: ${days} day${days===1?'':'s'} remaining`:sub.status==='active'?'Active subscription':String(sub.status||'').replaceAll('_',' ');
  el.innerHTML=`<div class="row"><div><strong>${esc(plans[sub.plan]||'Business')} plan</strong><small>${esc(status)}${sub.cancel_at_period_end?' · Cancels at period end':''}</small></div><span class="badge">${esc(sub.billing_interval||'month')}</span></div>`;
 }catch(_){el.innerHTML='<div class="notice">Subscription status will appear here after billing is connected.</div>';}
}
function mount(){const app=document.getElementById('app');if(!app||document.getElementById('cleanReleasePanel'))return;const hero=app.querySelector('main .hero');if(hero){const panel=document.createElement('div');panel.id='cleanReleasePanel';panel.style.marginBottom='16px';hero.after(panel);loadSubscription();}}
window.VGCleanReleaseUI={mount,loadSubscription};
})();
