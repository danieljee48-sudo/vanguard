const Stripe = require('stripe');

const json=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

async function authenticatedUser(event){
  const supabaseUrl=process.env.SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY;
  const auth=event.headers?.authorization||event.headers?.Authorization||'';
  if(!supabaseUrl||!serviceKey)throw new Error('Authentication is not configured');
  if(!/^Bearer\\s+\\S+/i.test(auth))return null;
  const r=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:serviceKey,Authorization:auth}});
  if(!r.ok)return null;
  return r.json();
}

exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
  try{
    const secret=process.env.STRIPE_SECRET_KEY;
    const supabaseUrl=process.env.SUPABASE_URL;
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY;
    if(!secret||!supabaseUrl||!serviceKey)throw new Error('Billing is not configured');
    const user=await authenticatedUser(event);
    if(!user?.id)return json(401,{error:'Please sign in again.'});
    const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'};
    const r=await fetch(`${supabaseUrl}/rest/v1/clean_subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=stripe_customer_id&limit=1`,{headers});
    if(!r.ok)throw new Error('Could not load your billing account');
    const rows=await r.json();
    const customerId=rows?.[0]?.stripe_customer_id;
    if(!customerId) return json(400,{error:'No billing account is linked to this workspace yet. Start your trial first.'});
    const stripe=Stripe(secret);
    const portal=await stripe.billingPortal.sessions.create({
      customer:customerId,
      return_url:`${process.env.URL||'https://vanguardapp.co.uk'}/clean`
    });
    return json(200,{url:portal.url});
  }catch(e){
    return json(400,{error:e.message||'Could not open billing portal'});
  }
};
