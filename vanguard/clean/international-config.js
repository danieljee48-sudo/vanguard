/* VanGuard Clean international product configuration.
 * Keep the workflow country-neutral. These values control terminology,
 * formatting and defaults; they are not legal/compliance claims.
 */
window.VG_CLEAN_REGIONS = {
  INTL: { country: 'International', locale: 'en', currency: 'USD', timezone: 'UTC', dateFormat: 'MM/DD/YYYY', measurement: 'metric', terminology: { safetyAuthority: 'Local safety authority', evidence: 'Evidence', correctiveAction: 'Corrective action' } },
  GB:   { country: 'United Kingdom', locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London', dateFormat: 'DD/MM/YYYY', measurement: 'metric', terminology: { safetyAuthority: 'HSE', evidence: 'Evidence', correctiveAction: 'Corrective action' } },
  US:   { country: 'United States', locale: 'en-US', currency: 'USD', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', measurement: 'imperial', terminology: { safetyAuthority: 'OSHA', evidence: 'Evidence', correctiveAction: 'Corrective action' } },
  CA:   { country: 'Canada', locale: 'en-CA', currency: 'CAD', timezone: 'America/Toronto', dateFormat: 'YYYY-MM-DD', measurement: 'metric', terminology: { safetyAuthority: 'Local/provincial safety authority', evidence: 'Evidence', correctiveAction: 'Corrective action' } },
  AU:   { country: 'Australia', locale: 'en-AU', currency: 'AUD', timezone: 'Australia/Sydney', dateFormat: 'DD/MM/YYYY', measurement: 'metric', terminology: { safetyAuthority: 'Local WHS authority', evidence: 'Evidence', correctiveAction: 'Corrective action' } }
};

window.vgCleanDetectRegion = function () {
  const lang = (navigator.language || 'en-GB').toLowerCase();
  if (lang.endsWith('-us')) return 'US';
  if (lang.endsWith('-ca')) return 'CA';
  if (lang.endsWith('-au')) return 'AU';
  if (lang.endsWith('-gb')) return 'GB';
  return 'INTL';
};

window.vgCleanFormatDate = function (value, regionCode) {
  const region = window.VG_CLEAN_REGIONS[regionCode] || window.VG_CLEAN_REGIONS.INTL;
  try { return new Intl.DateTimeFormat(region.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return String(value || ''); }
};

window.vgCleanFormatMoney = function (amount, currency) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(Number(amount || 0)); }
  catch { return String(amount || ''); }
};
