import _ from 'lodash';
import querystring from 'querystring';
import urlencode from 'urlencode';
import configSender from 'config-uncached';
import axios from 'axios';
import log from './log';
import http from './http';
//import { replaceAll } from '../boiler/www/front/src/general/utils/utils';

const headers = {
  'User-Agent': 'NodeJS Chatbot by Company.com',
  'Content-Type': 'application/x-www-form-urlencoded',
};
const baseUrl = 'https://##USERNAME##:##PASSWORD##@##TENANT##-admin.##SERVER##/api';

const utils = {

  /**
   * Обновление статуса отправки
   *
   * @param {number} id
   * @param {string} status
   * @param {string} channel
   */
  async updateSenderpoolStatus(id, status, channel) {
    try {
      log('utils.updateSenderpoolStatus!');

      const apiConfig = configSender(true).get('api.config');
      const baseURL = utils.replaceSnippets(baseUrl, {
        USERNAME: apiConfig.username,
        PASSWORD: apiConfig.password,
        TENANT: apiConfig.tenant,
        SERVER: apiConfig.server,
      });
      const endpoint = `/v4/senderpool/${id}/`;
      let query = '';
      const dateSend = new Date().toISOString().slice(0, 19).replace('T', ' ');

      switch (status) {
        case 'success':
          query += '?Status=success&IsSent=true&IsDelivered=true&DeliveryStatusCode=1&IfNoState=0';
          query += `&Channel=${channel}&DateSend=${querystring.escape(dateSend)}`;
          break;

        case 'failed':
          query += '?Status=failed&IsSent=true&IsDelivered=false&DeliveryStatusCode=0&IfNoState=0';
          query += `&Channel=${channel}&DateSend=${querystring.escape(dateSend)}`;
          break;
      }

      log('baseURL', baseURL);
      log('endpoint', endpoint);
      log('query', query);

      const { data } = await axios({
        method: 'PUT',
        headers,
        baseURL,
        url: endpoint + query,
      });

      log('data', data);

      if (!data.response) {
        log('updateSenderpoolStatus Error occured', data);
        return false;
      }

      const count = parseInt(data.response.match(/\d+/)[0], 10);

      switch (count) {
        case 1:
          log('one record was updated!');
          return count;

        case 0:
          log('updateSenderpoolStatus No records were updated');
          return false;
      }
    } catch(error) {
      log('Error utils.updateSenderpoolStatus', error);
    }

    return false;
  },

  /**
   * Получение конфига бота
   *
   * @param {string} botName
   * @param {string} botToken
   *
   * @return {Promise}
   */
  async getBotConfig(botName, botToken) {
    try {
      const apiConfig = configSender(true).get('api.config');
      const baseURL = utils.replaceSnippets(baseUrl, {
        USERNAME: apiConfig.username,
        PASSWORD: apiConfig.password,
        TENANT: apiConfig.tenant,
        SERVER: apiConfig.server,
      });
      const endpoint = `/v5/${botName}bots`;
      const query = `?query=${urlencode(`[{"field":"Token","operation":"=","value":"${botToken}","andor":"and"}]`)}`;
      const { data } = await axios({
        method: 'GET',
        headers,
        baseURL,
        url: endpoint + query,
      });

      if (data && _.isArray(data)) {
        return data[0];
      }
    } catch (error) {
      log('Error utils.getBotConfig', error);
    }

    return false;
  },

  /**
   * По контексту находит ID объекта в БД
   *
   * @param {object} user
   *
   * @return {number} objectId
   */
  async decryptStartContextToObjectId(user, isNotGetObj = false) {
    try {
      // const endpoint = '/v4/objects/decryptobjectids';
      // const query = `?encryptedText=`;
      // const { data } = await http.get(endpoint + query);

      const url = '/v8/bots/decrypt';
      const params = {
        Token: urlencode(user.startContext),
      };
      // const config = {
      //   method: 'post',
      //   url,
      //   params,
      // };

      log(
        'decryptStartContextToObjectId!start',
      );
      // log(
      //   user.startContext,
      // );
      const TokenData2 = await http(process.env.NODE_ENV).post(url, JSON.stringify(params));
      // log(
      //   'TokenData2'
      // );
      // log(
      //   TokenData2
      // );
      const { data :{ TokenData }} = TokenData2;
      // log(
      //   'TokenData'
      // );
      // log(
      //   TokenData
      // );
      if (TokenData == 'false' || !TokenData){
        return false;
      }
      const { objectIds,applicationId,tenant } = TokenData;

      log('decryptStartContextToObjectId!end',);
      // log('tenant:');
      // log(tenant);
      // log('applicationId:');
      // log(applicationId);
      // log('objectIds:');
      // log(objectIds);
      // log('user.startContext:');
      // log(user.startContext,);

      return {
        tenant:tenant,
        applicationId:applicationId,
        objectIds:objectIds
      };

      // if (objectIds && _.isArray(objectIds)) {
      //   return objectIds[0];
      // }else{
      //   if(objectIds && !_.isArray(objectIds)){
      //     return objectIds;
      //   }
      // }

    } catch (error) {
      log('Error utils.decryptStartContextToObjectId', error);
    }

    return false;
  },

  /**
   * По коду находит ID объекта в БД
   *
   * @param {string} code
   *
   * @return {number}
   */
  async decryptCodeToObjectId(code) {
    try {
      const endpoint = '/v4/objects/decrypt_vk';
      const query = `?encryptedText=${code}`;
      const { data, error } = await http(process.env.NODE_ENV).get(endpoint + query);

      if (error) {
        logger.error('Error utils.decryptCodeToObjectId', error);
        log('decryptCodeToObjectId: data', data);
        return false;
      }
      if (data && data.response) {
        return parseInt(data.response, 10);
      }
    } catch (error) {
      log('Error utils.decryptCodeToObjectId', error);
    }

    return false;
  },

  /**
   * Создание пустого объекта для текущего пользователя
   *
   * @param {object} user
   * @return {number} objectId
   */
  async createEmptyObject(user) {
    try {
      log('utils.createEmptyObject!');

      const endpoint = '/v4/objects';
      const query = querystring.stringify({
        ApplicationId: user.getApplicationId(),
        Enabled: '1',
      });
      const { data } = await http(process.env.NODE_ENV).post(endpoint, query);

      return data;
    } catch (error) {
      log('Error utils.createEmptyObject', error);
    }

    return false;
  },

  /**
   * Фиксирует сообщение в БД от имени пользователя
   *
   * @param {object} user
   * @param {string} incomingText
   *
   * @return {object}
   */
  async saveMessage(user, incomingText) {
    try {
      return utils._saveMessage(user, incomingText);
    } catch (error) {
      log('Error utils.saveMessage', error);
    }

    return false;
  },

  /**
   * Фиксирует сообщение в БД от имени бота
   *
   * @param {object} user
   * @param {string} incomingText
   *
   * @return {object}
   */
  async saveMessageAsBot(user, incomingText) {
    try {
      return utils._saveMessage(user, incomingText, true);
    } catch (error) {
      log('Error utils.saveMessageAsBot', error);
    }

    return false;
  },

  /**
   * Фиксирует сообщение в БД
   *
   * @param {object} user
   * @param {string} incomingText
   * @param {boolean} asBot
   *
   * @return {object}
   *
   * @private
   */
  async _saveMessage(user, incomingText, asBot = false) {
    try {
      const endpoint = (asBot === true) ? '/v5/chat/sendmessageasbot' : '/v5/chat/sendmessage';
      // let formdata=new FormData();
      // formdata.append('MessengerId',user.getMessengerId());
      // formdata.append('Channel',user.botName);
      // formdata.append('EventId',0);
      // formdata.append('Message',incomingText);
      // formdata.append('AplicationId',user.getApplicationId());

      const query = querystring.stringify({
        MessengerId: user.getMessengerId(),
        Channel: user.botName,
        EventId: 0,
        Message: incomingText,
        AplicationId: user.getApplicationId(),
      });
      const { data } = await http(process.env.NODE_ENV).post(endpoint, query);

      return data;
    } catch (error) {
      log('Error utils._saveMessage', error);
    }

    return false;
  },

  /**
   * Замена сниппетов в строке
   *
   * @param {string} value
   * @param {object} snippets
   * @return {string}
   */
  replaceSnippets(value, snippets) {
    let result = value;

    for (const key in snippets) {
      result = utils.replaceAll(result, `##${key}##`, snippets[key]);
    }

    // if (result.indexOf('http')==0){
    //   result = replaceAll(result, `-admin-admin`, `-admin`);// yap, true of life //if in .env of company_mu_vue you set TENANT_NAME with '-admin'
    // }

    return result;
  },

  /**
   * Множественная замена подстроки
   *
   * @param {string} value
   * @param {string} find
   * @param {string} replace
   * @return {string}
   */
  replaceAll(value, find, replace) {
    return value.replace(new RegExp(utils.escapeRegExp(find), 'g'), replace);
  },

  /**
   * Экранирование спецсимволов для регулярных выражений
   *
   * @param {string} value
   * @return {string}
   */
  escapeRegExp(value) {
    return value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  },

};

export default utils;
