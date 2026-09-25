/* VanGuard Clean — release UI: subscription status and billing CTA. */
(function(){'use strict';
const U='https://qzzwkxborlmmyaukvhga.supabase.co';
const K='sb_publishable_0NmXA2uINNjhyGfZ0BCtGA_z_s2Q10z';
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function getSession(){try{return JSON.parse(localStorage.getItem('vg_clean_session')||'null')}catch(_){return null}}
async function bridgeApi(path,opts={}){const s=getSession(),token=s?.access_token||K;const r=await fetch(U+'/rest/v1/'+path,{...opts,headers:{apikey:K,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation',...(opts.headers||{})}});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}if(!r.ok)throw new Error(data?.message||data?.error_description||text||'Request failed');return data}
window.api=window.api||bridgeApi;
const plans={starter:'Starter',business:'Business',pro:'Pro'};
let observerStarted=false;
async function loadSubscription(){
 const el=document.getElementById('cleanReleasePanel'),s=getSession();if(!el||!s?.user?.id||!window.api)return;
 try{
  const rows=await window.api(`clean_subscriptions?user_id=eq.${encodeURIComponent(s.user.id)}&order=updated_at.desc&limit=1`),sub=rows?.[0];
  if(!sub){
   el.innerHTML='<div class="card"><strong>Free forever for 1 site</strong><p style="margin:6px 0 12px;color:#64748b">No card required. Upgrade when you need more sites or team logins.</p><div id="cleanPlanChoices"></div></div>';
   if(window.VGCleanSubscription?.renderPlans)window.VGCleanSubscription.renderPlans('cleanPlanChoices');
   return;
  }
  const status=sub.status==='active'?'Active subscription':String(sub.status||'').replaceAll('_',' ');
  el.innerHTML=`<div class="card"><div class="row"><div><strong>${esc(plans[sub.plan]||'Business')} plan</strong><small>${esc(status)}${sub.cancel_at_period_end?' · Cancels at period end':''}</small></div><span class="badge">${esc(sub.billing_interval||'month')}</span></div><div class="actions" style="margin-top:12px"><button class="btn secondary" id="cleanManageBilling">Manage billing</button></div><small style="display:block;margin-top:8px;color:#64748b">Update payment details, invoices or cancellation in Stripe.</small></div>`;
  const manage=document.getElementById('cleanManageBilling');if(manage)manage.onclick=async()=>{manage.disabled=true;manage.textContent='Opening…';try{await window.VGCleanSubscription?.openBillingPortal()}catch(e){alert(e.message||'Unable to open billing portal');manage.disabled=false;manage.textContent='Manage billing'}};
 }catch(_){el.innerHTML='<div class="notice">Subscription status is temporarily unavailable. Your account and existing records are unchanged.</div>';}
}
function mount(){const app=document.getElementById('app');if(!app||document.getElementById('cleanReleasePanel'))return;const hero=app.querySelector('main .hero');if(hero){const panel=document.createElement('div');panel.id='cleanReleasePanel';panel.style.marginBottom='16px';hero.after(panel);loadSubscription();}}
function startLifecycle(){if(observerStarted)return;observerStarted=true;const app=document.getElementById('app');if(!app)return;const tick=()=>mount();tick();const mo=new MutationObserver(tick);mo.observe(app,{attributes:true,childList:true,subtree:true});setTimeout(()=>{try{mo.disconnect()}catch(_){ }},120000);}
window.VGCleanReleaseUI={mount,loadSubscription,startLifecycle};
})();