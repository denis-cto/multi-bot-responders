import vb from 'viber-bot';
import winston from 'winston';
import toYAML from 'winston-console-formatter';
import log from '../log';
import utils from '../utils';
import BaseCompanySender from '../BaseCompanySender';

const ViberBot = vb.Bot;
const TextMessage = vb.Message.Text;

function createLogger() {
  const logger = new winston.Logger({
    level: 'debug',
  }); // We recommend DEBUG for development
  logger.add(winston.transports.Console, toYAML.config());
  return logger;
}

export default class CompanySenderViber extends BaseCompanySender {

  /**
   * ...
   */
  constructor() {
    super('viber', 'viber_listener');
  }

  /**
   * Создание бота
   *
   * @param {object} params
   */
  async createBot(params) {
    try {
      const webhookUrl = `${this.host}:${this.port}`;
      this.botData = await utils.getBotConfig(this.botName, params.token);

      log('webhookUrl', webhookUrl);
      log('botData', this.botData);

      this.bot = new ViberBot({
        logger: createLogger(),
        path: webhookUrl,
        authToken: this.botData.Token,
        name: this.botData.Name,
        avatar: this.botData.IconUrl,
      });

      log('bot', this.bot);
    } catch (error) {
      log(`Error ${this.botName}Sender.createBot`, error);
    }
  }

  /**
   * Отправка сообщения в мессенджер
   *
   * @param {*} params
   * @param {string} message
   *
   * @return {Promise<>}
   */
  async sendMessage(params, message) {
    try {
      log(`${this.botName}Sender.sendMessage!`);

      const sendData = {
        id: params.messengerId,
        sender: {
          name: this.botData.Name,
          avatar: this.botData.IconUrl,
        },
      };

      return this.bot.sendMessage(sendData, new TextMessage(message));
    } catch (error) {
      log(`Error ${this.botName}Sender.sendMessage`, error);
    }

    return false;
  }

}
