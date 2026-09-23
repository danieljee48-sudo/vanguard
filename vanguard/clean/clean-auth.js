(function(){
'use strict';
const URL='https://qzzwkxborlmmyaukvhga.supabase.co';
const KEY='sb_publishable_0NmXA2uINNjhyGfZ0BCtGA_z_s2Q10z';
function el(id){return document.getElementById(id)}
function message(text){const x=el('authmsg');if(x)x.textContent=text||''}
function fields(){return {email:(el('email')?.value||'').trim(),password:el('password')?.value||''}}
async function login(){
 const btn=Array.from(document.querySelectorAll('#login button')).find(x=>x.textContent.trim()==='Sign in');
 const f=fields();
 message('');
 if(!f.email){message('Enter your email address.');return}
 if(!f.password){message('Enter your password.');return}
 if(btn){btn.disabled=true;btn.textContent='Signing in…'}
 try{
  const response=await fetch(URL+'/auth/v1/token?grant_type=password',{
   method:'POST',
   headers:{apikey:KEY,'Content-Type':'application/json'},
   body:JSON.stringify({email:f.email,password:f.password})
  });
  const raw=await response.text();
  let data={};try{data=raw?JSON.parse(raw):{}}catch(_){}
  if(!response.ok)throw new Error(data.msg||data.message||data.error_description||data.error||raw||('Sign in failed (HTTP '+response.status+')'));
  if(!data.access_token||!data.user?.id)throw new Error('Supabase returned no valid login session.');
  localStorage.setItem('vg_clean_session',JSON.stringify(data));
  message('Signed in. Loading your workspace…');
  if(typeof window.boot!=='function')throw new Error('Workspace loader is not available. Please refresh the page.');
  if(typeof window.setCleanSession==='function')window.setCleanSession(data);else throw new Error('Workspace session bridge is not available. Please refresh the page.');
  await window.boot();
 }catch(e){
  message(e?.message||'Sign in failed.');
  if(btn){btn.disabled=false;btn.textContent='Sign in'}
 }
}
function wire(){
 window.__VGCleanAuthLoaded=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
window.signIn=login;
})();