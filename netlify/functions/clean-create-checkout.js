const Stripe = require('stripe');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode:405, body:JSON.stringify({error:'Method not allowed'}) };
  try {
    const secret=process.env.STRIPE_SECRET_KEY;if(!secret)throw Error('Stripe is not configured');
    const stripe=Stripe(secret),body=JSON.parse(event.body||'{}'),yearly=body.priceType==='yearly';
    const plan=['starter','business','pro'].includes(body.plan)?body.plan:'business';
    const envKey=`CLEAN_STRIPE_${plan.toUpperCase()}_${yearly?'YEARLY':'MONTHLY'}_PRICE_ID`;
    const price=process.env[envKey]||process.env.CLEAN_STRIPE_MONTHLY_PRICE_ID;
    if(!price)throw Error(`${plan} ${yearly?'yearly':'monthly'} price is not configured`);
    const metadata={product:'vanguard-clean',user_id:String(body.user_id||''),plan};
    const checkout=await stripe.checkout.sessions.create({mode:'subscription',line_items:[{price,quantity:1}],payment_method_collection:'always',customer_email:body.email||undefined,subscription_data:{trial_period_days:14,metadata},metadata,success_url:`${process.env.URL||'https://vanguardapp.co.uk'}/clean?checkout=success`,cancel_url:`${process.env.URL||'https://vanguardapp.co.uk'}/clean?checkout=cancelled`});
    return {statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify({url:checkout.url})};
  } catch(e){return {statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'Checkout failed'})};}
};