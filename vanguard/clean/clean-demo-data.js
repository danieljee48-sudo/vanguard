/* Demo data used only when the Clean app is in demo mode.
 * Deliberately contains no customer personal data.
 */
window.VG_CLEAN_DEMO = {
  sites: [
    { id: 'demo-site-1', customer_name: 'Northstar Offices', site_name: 'Birmingham HQ', address: 'City Centre', frequency: 'daily', active: true },
    { id: 'demo-site-2', customer_name: 'Harbour Retail', site_name: 'Solihull Store', address: 'High Street', frequency: 'daily', active: true },
    { id: 'demo-site-3', customer_name: 'Westfield Pub Co', site_name: 'The Oak House', address: 'Market Square', frequency: 'weekly', active: true }
  ],
  checklists: [
    { id: 'demo-list-1', name: 'Office Daily Clean', description: 'Core daily office cleaning standard', frequency: 'daily', items: ['Empty waste bins', 'Vacuum carpeted areas', 'Mop hard floors', 'Clean high-touch surfaces', 'Clean washrooms', 'Check consumables', 'Record defects or hazards'] },
    { id: 'demo-list-2', name: 'Restroom Inspection', description: 'Quality and consumables check', frequency: 'daily', items: ['Toilets visibly clean', 'Basins and taps clean', 'Mirrors clean', 'Floors clean and dry', 'Soap available', 'Paper/towels available', 'Waste bins emptied'] }
  ]
};
