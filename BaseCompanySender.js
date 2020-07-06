import express from 'express';
import bodyParser from 'body-parser';
import log from './log';
import utils from './utils';

export default class BaseCompanySender {

  /**
   * ...
   *
   * @param {string} botName
   * @param {string} host
   */
  constructor(botName, host) {
    try {
      this.botName = botName;
      this.host = host;
      this.port = 9999;
      this.server = express();
      this.botData = {};
      this.bot = {};

      // to support URL-encoded bodies
      this.server.use(bodyParser.urlencoded({
        extended: true,
      }));

      this.server.post('/sendpush', (request, response) => {
        this.onSendPush(request, response);
      });
      this.server.listen(this.port, this.host, () => {
        log(`Express server listening on ${this.host} ${this.port}`);
      });
    } catch (error) {
      log(`Error ${this.botName}Sender.constructor`, error);
    }
  }

  /**
   * Создание бота
   *
   * @param {object} params
   *
   * @return {Promise<object>}
   */
  async createBot(params) {}

  /**
   * ...
   *
   * @param {object} request
   * @param {object} response
   */
  async onSendPush(request, response) {
    try {
      log(`${this.botName}Sender.onSendPush!`);
      log('request.body', request.body);

      const data = request.body || {};

      const oldenv = process.env.NODE_ENV;
      log('ENV WAS', process.env.NODE_ENV);
      process.env.NODE_ENV = process.env.NODE_ENV+`_${data.tenantName}${data.applicationId}`;
      log('ENV SET', process.env.NODE_ENV);

      await this.createBot(data);

      const isSended = await this.sendMessage(data, data.text);

      log('isSended', isSended);

      if (isSended.response || (Array.isArray(isSended) && isSended.length > 0 && isSended[0] > 0)) {
        log('message sent!');
        response.json({'status': 'ok'});
        response.end();

        const updatedSenderpool = await utils.updateSenderpoolStatus(data.senderpoolId, 'success', this.botName);

        log('updatedSenderpool', updatedSenderpool);
      } else {
        log('message not sent!!!');
        response.json({'status': 'undefined response'});
        response.end();
        /**
         * We do not change the status for such messages. We are waiting for auto switching after timeout.
         */
        //const updatedSenderpool = await utils.updateSenderpoolStatus(data.senderpoolId, 'failed', this.botName);
        //log('updatedSenderpool', updatedSenderpool);
      }

      process.env.NODE_ENV = oldenv;
    } catch (error) {
      log(`Error ${this.botName}Sender.onSendPush`, error);
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
  async sendMessage(params, message) {}

}
