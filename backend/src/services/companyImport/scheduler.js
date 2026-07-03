/**
 * Weekly refresh scheduler for tracked company import jobs.
 */

const cron = require('node-cron');
const { refreshAllTracked } = require('./index');

let task = null;

function registerWeeklyRefresh(cronExpr = '0 4 * * 0') {
  if (process.env.COMPANY_REFRESH_ENABLED === 'false') return null;
  if (task) return task;

  task = cron.schedule(cronExpr, async () => {
    try {
      const summary = await refreshAllTracked();
      console.log('[CompanyImport] weekly refresh complete', summary);
    } catch (err) {
      console.error('[CompanyImport] weekly refresh failed', err.message);
    }
  });

  console.log(`[CompanyImport] weekly refresh scheduled (${cronExpr})`);
  return task;
}

module.exports = { registerWeeklyRefresh };
