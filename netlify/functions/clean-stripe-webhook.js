const Stripe = require('stripe');

async function saveSubscription({ supabaseUrl, serviceKey, row }) {
  const base=`${supabaseUrl}/rest/v1/clean_subscriptions`,headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'return=representation'};
  const lookup=await fetch(`${base}?user_id=eq.${encodeURIComponent(row.user_id)}&limit=1`,{headers});
  if(!lookup.ok)throw new Error(await lookup.text());
  const existing=await lookup.json();
  if(existing[0]?.id){const r=await fetch(`${base}?id=eq.${existing[0].id}`,{method:'PATCH',headers,body:JSON.stringify(row)});if(!r.ok)throw new Error(await r.text());return r.json();}
  const r=await fetch(base,{method:'POST',headers,body:JSON.stringify(row)});if(!r.ok)throw new Error(await r.text());return r.json();
}

exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return{statusCode:405,body:'Method not allowed'};
 const secret=process.env.STRIPE_SECRET_KEY,webhookSecret=process.env.CLEAN_STRIPE_WEBHOOK_SECRET,supabaseUrl=process.env.SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||!webhookSecret||!supabaseUrl||!serviceKey)return{statusCode:500,body:'Billing webhook is not configured.'};
 try{
  const stripe=Stripe(secret),signature=event.headers?.['stripe-signature']||event.headers?.['Stripe-Signature'];
  const ev=stripe.webhooks.constructEvent(event.body||'',signature,webhookSecret);
  if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(ev.type)){
   const s=ev.data?.object,m=s?.metadata||{},uid=m.user_id;
   if(m.product==='vanguard-clean'&&uid){
    const item=s.items?.data?.[0],priceId=item?.price?.id||'';
    const plan=m.plan||(priceId===process.env.CLEAN_STRIPE_PRO_MONTHLY_PRICE_ID||priceId===process.env.CLEAN_STRIPE_PRO_YEARLY_PRICE_ID?'pro':priceId===process.env.CLEAN_STRIPE_STARTER_MONTHLY_PRICE_ID||priceId===process.env.CLEAN_STRIPE_STARTER_YEARLY_PRICE_ID?'starter':'business');
    await saveSubscription({supabaseUrl,serviceKey,row:{user_id:uid,stripe_customer_id:String(s.customer||''),stripe_subscription_id:s.id,plan,billing_interval:item?.price?.recurring?.interval||'month',status:s.status,trial_end:s.trial_end?new Date(s.trial_end*1000).toISOString():null,current_period_end:s.current_period_end?new Date(s.current_period_end*1000).toISOString():null,cancel_at_period_end:!!s.cancel_at_period_end,updated_at:new Date().toISOString()}});
   }
  }
  return{statusCode:200,body:JSON.stringify({received:true})};
 }catch(e){return{statusCode:400,body:JSON.stringify({error:e.message||'Webhook error'})};}
};
