
const axios = require('axios');
const Agent = require('agentkeepalive');

/**
 * @constructor
 * @description
 * Create a logger instance.
 * @param {object} options - The options for the logger.
 * @param {string} options.connectionString - The url for sending the logs.
 * @param {function=} options.onLog - Right when orig log is received.
 * @param {function=} options.onLogged - Callback for log is flushed.
 */
const Logger = function (options) {
  this.options = options || {};
  this.logs = [];
  const keepAliveAgent = new Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 20000,
    freeSocketTimeout: 10000,
  });
  this.axios = axios.create({
    httpAgent: keepAliveAgent,
    httpsAgent: keepAliveAgent,
  });

  if (!this.options.connectionString) {
    throw new Error('connectionString is required');
  }
};

Logger.prototype.flush = async function() {
  if (!this.logs.length) return;
  const logsToSend = this.logs.splice(0);
  this.logs.length = 0;
  try {
    await axios.post(
      this.options.connectionString,
      JSON.stringify({ logs: logsToSend }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (this.options.onLogged) {
      for (const log of logsToSend) {
        this.options.onLogged(log);
      }
    }
  }catch(e){
    this.logs.splice(0, 0, logsToSend);
    console.log(`Logger.flush failed (will retry soon): ${e}`);
    setTimeout(() => this.flushSoon(), 30000);
  }
};

Logger.prototype.flushSoon = function() {
  if (this.flushSoonTimeout) return;
  this.flushSoonTimeout = setTimeout(() => {
    clearTimeout(this.flushSoonTimeout);
    this.flushSoonTimeout = null;
    this.flush();
  }, 2000);
};

/**
 * @description
 * Send a log or array of logs. Time will be assigned if not already assigned.
 * @param {(array | object)} logOrLogs - The log or logs to send.
 * @param {string} logOrLogs.time - Date.now()
 * @param {string} logOrLogs.env - prod, test, or dev
 * @param {string} logOrLogs.env - prod, test, or dev
 * @param {string} logOrLogs.process - build, web, worker, api, singleton
 * @param {string} logOrLogs.source - system, db, request
 * @param {string} logOrLogs.event -
 * @param {boolean} logOrLogs.error -
 * @param {string} logOrLogs.msg - a detailed message
 */
Logger.prototype.log = function(logOrLogs) {
  if (!logOrLogs) return;
  const logs = Array.isArray(logOrLogs) ? logOrLogs : [logOrLogs];
  if (!logs.length) return;

  if (this.options.onLog) {
    for (const log of logs) {
      this.options.onLog(log);
    }
  }

  for (const log of logs) {
    log.time = log.time || Date.now();
    this.logs.push(log);
  }

  this.flushSoon();
};

module.exports.Logger = Logger;
