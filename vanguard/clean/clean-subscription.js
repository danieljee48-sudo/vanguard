/* VanGuard Clean — subscription/trial UI helpers */
(function () {
  'use strict';

  const PLANS = {
    starter: { name: 'Starter', monthly: 9.99, yearly: 99.90, sites: 3 },
    business: { name: 'Business', monthly: 24.99, yearly: 249.90, sites: 15 },
    pro: { name: 'Pro', monthly: 49.99, yearly: 499.90, sites: 999 }
  };

  function money(value, currency = 'GBP') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
  }

  function trialCopy(days = 14) {
    return `${days}-day free trial. Your card is required at signup, but you won't be charged until the trial ends.`;
  }

  async function startCheckout({ plan = 'business', yearly = false, email = '', userId = '', functionUrl = '/.netlify/functions/create-checkout' } = {}) {
    if (!PLANS[plan]) throw new Error('Unknown plan');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceType: yearly ? 'yearly' : 'monthly',
        trial: true,
        email,
        user_id: userId
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || 'Unable to start checkout');
    window.location.href = data.url;
  }

  window.VGCleanSubscription = { PLANS, money, trialCopy, startCheckout };
})();
