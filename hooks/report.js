// Example centralized reporting hook
const fs = require('fs');
const path = require('path');

const logFile = path.resolve(__dirname, '../.wf-log.json');

function logAction(action, details = {}) {
  let logs = [];
  if (fs.existsSync(logFile)) {
    logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  }
  logs.push({ action, details, timestamp: new Date().toISOString() });
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

module.exports = { logAction };
