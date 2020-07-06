import config from 'config';
import LangMessage from '../LangMessage';
import CompanyBotTelegram from './CompanyBotTelegram';

const serverConfig = config.get('server.config');
const companyBotTelegram = new CompanyBotTelegram(serverConfig.host, process.env);

companyBotTelegram.setLangMessage(new LangMessage('ru'));
