import config from 'config';
import LangMessage from '../LangMessage';
import CompanyBotViber from './CompanyBotViber';

const serverConfig = config.get('server.config');
const companyBotViber = new CompanyBotViber(serverConfig.host, process.env);

companyBotViber.setLangMessage(new LangMessage('ru'));
