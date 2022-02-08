
const { Logger } = require('./');
const { connectionString } = require('./test-settings');

(async () => {
  const logger = new Logger({
    onLog: l => console.log(JSON.stringify(l)),
    connectionString,
  });

  setTimeout(() => logger.log([{ env: 'dev', process: 'local', source: 'system', msg: 'Test 1' }]), 0);
  setTimeout(() => logger.log([{ env: 'dev', process: 'local', source: 'system', msg: 'Test 2' }]), 1000);
  setTimeout(() => logger.log([{ env: 'dev', process: 'local', source: 'system', msg: 'Test 3' }]), 3000);
  setTimeout(() => logger.log([{ env: 'dev', process: 'local', source: 'system', msg: 'Test 4' }]), 10000);
  setTimeout(() => process.exit(), 15000);
})();
