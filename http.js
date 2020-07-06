import config from 'config';
import axios from 'axios';

function http(envName = null) {
  let oldEnv = process.env.NODE_ENV;
  console.log('OldEnv=',oldEnv)
  if (envName !== '') {
    process.env.NODE_ENV = envName;
  }
  console.log('newEnv=',process.env.NODE_ENV );
  let importFresh = require('import-fresh');
  let config_testing = importFresh('config');
  const apiConfig = config_testing.get('api.config');
  const urlApi = `https://${apiConfig.username}:${apiConfig.password}@${apiConfig.tenant}-admin.${apiConfig.server}/api`;
  console.log('urlApi',urlApi)
  process.env.NODE_ENV = oldEnv;

  return axios.create({
    baseURL: urlApi,
    timeout: 3000,
    headers: {
      'User-Agent': 'NodeJS Chatbot by Company.com',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export default http;
