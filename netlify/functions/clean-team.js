const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qzzwkxborlmmyaukvhga.supabase.co';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const json = (statusCode, body) => ({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
async function sb(path, options={}) {
  const r=await fetch(SUPABASE_URL+path,{...options,headers:{apikey:SUPABASE_SECRET,Authorization:'Bearer '+SUPABASE_SECRET,'Content-Type':'application/json',...(options.headers||{})}});
  const text=await r.text(); let data; try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||text||'Supabase request failed');
  return data;
}
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
  if(!SUPABASE_SECRET)return json(500,{error:'Team service is not configured'});
  const auth=event.headers.authorization||event.headers.Authorization||'';
  if(!auth.startsWith('Bearer '))return json(401,{error:'Sign in required'});
  try{
    const token=auth.slice(7);
    const me=await sb('/auth/v1/user',{headers:{Authorization:'Bearer '+token}});
    const members=await sb('/rest/v1/clean_memberships?user_id=eq.'+encodeURIComponent(me.id)+'&active=eq.true&select=workspace_id,role');
    const membership=members?.[0];
    if(!membership||!['owner','admin'].includes(membership.role))return json(403,{error:'Only the workspace owner or admin can manage the team.'});
    const subs=await sb('/rest/v1/clean_subscriptions?user_id=eq.'+encodeURIComponent(me.id)+'&status=in.(active,trialing,past_due,incomplete)&select=plan&limit=1');
    if(!subs?.[0]||!['business','pro'].includes(subs[0].plan))return json(403,{error:'Team logins are available on Business and Pro plans.'});
    const body=JSON.parse(event.body||'{}');
    const email=String(body.email||'').trim().toLowerCase();
    const displayName=String(body.display_name||'').trim().slice(0,120);
    const role=body.role==='admin'?'admin':'cleaner';
    if(!email||!email.includes('@'))return json(400,{error:'Enter a valid email address.'});
    if(!displayName)return json(400,{error:'Enter a name.'});
    const created=await sb('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,email_confirm:true,user_metadata:{product:'clean',name:displayName,workspace_id:membership.workspace_id,role}})});
    const user=created?.user||created;
    if(!user?.id)throw new Error('Supabase did not return the new user.');
    await sb('/rest/v1/clean_memberships',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({workspace_id:membership.workspace_id,user_id:user.id,role,display_name:displayName,active:true})});
    return json(200,{id:user.id,email:user.email,display_name:displayName,role});
  }catch(e){return json(400,{error:e.message||'Could not create team member.'})}
};
