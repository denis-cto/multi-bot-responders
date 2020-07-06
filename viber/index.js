// console.log('process.env:');
// console.log(process.env);

// disable multiple instances
if (process.env.INSTANCE_ID === '0') {
  require('babel-core/register');
  require('babel-polyfill');
  require('./processStarter');
}
