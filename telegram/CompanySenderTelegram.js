import Telegraf from 'telegraf';
import SocksAgent from 'socks5-https-client/lib/Agent';
import log from '../log';
import BaseCompanySender from '../BaseCompanySender';

export default class CompanySenderTelegram extends BaseCompanySender {

  /**
   * ...
   */
  constructor() {
    super('telegram', 'telegram_listener');
  }

  /**
   * Создание бота
   *
   * @param {object} params
   */
  async createBot(params) {
    try {
      this.bot = new Telegraf(params.token);
      // , {
      //   telegram: {
      //     agent: new SocksAgent({
      //       socksHost: 'eu.company.com',
      //       socksPort: 1080,
      //     }),
      //   }
      // });

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

      return this.bot.telegram.sendMessage(params.messengerId, message);
    } catch (error) {
      log(`Error ${this.botName}Sender.sendMessage`, error);
    }

    return false;
  }

}
