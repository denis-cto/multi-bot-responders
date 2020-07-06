import config from 'config';
import LangMessage from '../LangMessage';
import CompanyBotVk from './CompanyBotVk';

const serverConfig = config.get('server.config');
const companyBotVk = new CompanyBotVk(serverConfig.host, process.env);

companyBotVk.setLangMessage(new LangMessage('ru'));
