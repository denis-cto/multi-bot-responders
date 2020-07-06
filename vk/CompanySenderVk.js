import { Botact } from 'botact';
import log from '../log';
import utils from '../utils';
import BaseCompanySender from '../BaseCompanySender';

export default class CompanySenderVk extends BaseCompanySender {

  /**
   * ...
   */
  constructor() {
    super('vk', 'vk_listener');
  }

  /**
   * Создание бота
   *
   * @param {object} params
   */
  async createBot(params) {
    try {
      this.botData = await utils.getBotConfig(this.botName, params.token);

      log('botData', this.botData);

      this.bot = new Botact({
        confirmation: this.botData.Confirmation,
        token: this.botData.Token,
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

      return this.bot.reply(parseInt(params.messengerId, 10), message);
    } catch (error) {
      log(`Error ${this.botName}Sender.sendMessage`, error);
    }

    return false;
  }

}
