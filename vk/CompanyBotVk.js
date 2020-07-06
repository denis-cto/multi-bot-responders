import express from 'express';
import server from 'http';
import bodyParser from 'body-parser';
// import { Botact } from 'botact';
const VkBot = require('node-vk-bot-api')
import log from '../log';
import utils from '../utils';
import BaseCompanyBot from '../BaseCompanyBot';
import User from '../User';

export default class CompanyBotVk extends BaseCompanyBot {

  /**
   * @param {string} host
   * @param {object} params
   */
  constructor(host, params) {
    try {
      super(host, params);

      log('CompanyBotVk!');

      this.botName = 'vk';
      this.webhookUrl = `/bot/${this.params.port}`;

      this.init();
    } catch (error) {
      log(`Error ${this.botName}.constructor`, error);
    }
  }

  /**
   * Инициализация
   */
  init() {
    try {
      this.app = express();
      // console.log('token '+this.params.Token);
      // console.log('Confirmation '+this.params.Confirmation);
      this.bot = new VkBot({
        confirmation: this.params.Confirmation,
        token: this.params.Token,
      });

      this.setListeners();

      this.app.use(bodyParser.json());

      this.app.post(this.webhookUrl, this.bot.webhookCallback);

      server
        .createServer(this.app)
        .listen(this.params.port, '0.0.0.0');
    } catch (error) {
      log(`Error ${this.botName}.init`, error);
    }
  }

  /**
   * Установка слушателей
   */
  setListeners() {
    try {
      /**
       * Обработчик ошибок
       */

      // this.bot.catch((context, error) => {
      //   log('Error!', error);
      // });

      /**
       * Обработчик всех входящих сообщений
       */
      this.bot.on(async (context) => {
        console.log(context)
        //this.botReply(context, 'HEllo');
        const incomingText = (context.message.text) ? context.message.text.toLowerCase().trim() : '';

        this.user = await this.getUser(context);

        if (this.checkAccess() && !this.user.isSubscribed()) {
          this.onStartCommand(context, incomingText);
        } else {
          switch (incomingText) {
            case '/whereareyoufrom':
              this.onWhereAreYouFromCommand(context);
              break;

            case '/help':
              this.onHelpCommand(context);
              break;

            default:
              this.onTextMessageReceived(context);
          }
        }
      });
    } catch (error) {
      log(`Error ${this.botName}.setListeners`, error);
    }
  }

  /**
   * Обработчик вложений
   *
   * @param {object} context
   */
  attachmentsHandler(context) {
    if (context.attachments) {
      context.attachments.forEach(attachment => {
        switch (attachment.type) {
          case 'photo':
            this.onImageHandler(context, attachment);
            break;

          case 'audio':
          case 'audio_message':
            this.onAudioHandler(context, attachment);
            break;

          case 'video':
            this.onVideoHandler(context, attachment);
            break;

          case 'doc':
            this.onFileHandler(context, attachment);
            break;

          case 'point':
            this.onGeoHandler(context, attachment);
            break;
        }
      });
    }
  }

  /**
   * Обработчик первоначального запуска бота
   *
   * @param {object} context
   * @param {string} incomingText
   */
  async onStartCommand(context,incomingText) {
    try {
      log(`${this.botName}.onStartCommand!`);


      if (!this.checkAccess()) {
        return false;
      }

      const messageFail = this.langMessage.messageVerificationCodeError();
      const messageJoined = this.langMessage.userJoinedSelfMessage(this.user.getName(), this.botName);



      // если сообщение является валидным кодом верификации
      if (!this.codeValidate(incomingText)) {
        this.botReply(context, messageFail);
        return false;
      }

      // запрос к АПИ, для получения ObjectId пользователя
      const objectId = await utils.decryptCodeToObjectId(incomingText);

      if (!objectId) {
        this.botReply(context, messageFail);
        return false;
      }

      // обновление данных пользователя
      await this.user.setObjectIds(objectId);
      await this.user.save();

      if (this.user.isEmptyObjects()) {
        const isCreatedEmptyObject = await this.user.createEmptyObject();

        log('isCreatedEmptyObject', isCreatedEmptyObject);
      }

      this.attachmentsHandler(context);
      this.saveMessage(context, messageJoined);
      await this.botReplyWelcome(context);

      if (!this.user.isEmptyObjects()) {
        this.user.subscribe();
      }
    } catch (error) {
      log(`Error ${this.botName}.onStartCommand`, error);
    }
  }

  /**
   * Обработчик команды помощи
   *
   * @param {object} context
   */
  async onHelpCommand(context) {
    try {
      log(`${this.botName}.onHelpCommand!`);

      await this.botReply(context, 'This');
      await this.botReply(context, 'is');
      await this.botReply(context, 'help');
      this.botReply(context, 'message');
    } catch (error) {
      log(`Error ${this.botName}.onHelpCommand`, error);
    }
  }

  /**
   * Обработчик текстового сообщения
   *
   * @param {object} context
   */
  async onTextMessageReceived(context) {
    try {
      log(`${this.botName}.onTextMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      const incomingText = context.text;

      this.attachmentsHandler(context);
      this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onTextMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с изображением
   *
   * @param {object} context
   * @param {object} attachment
   */
  async onImageHandler(context, attachment) {
    try {
      log(`${this.botName}.onImageHandler!`);
      log('attachment', attachment);
    } catch (error) {
      log(`Error ${this.botName}.onImageHandler`, error);
    }
  }

  /**
   * Обработчик сообщения с аудио
   *
   * @param {object} context
   * @param {object} attachment
   */
  async onAudioHandler(context, attachment) {
    try {
      log(`${this.botName}.onAudioHandler!`);
      log('attachment', attachment);
    } catch (error) {
      log(`Error ${this.botName}.onAudioHandler`, error);
    }
  }

  /**
   * Обработчик сообщения с видео
   *
   * @param {object} context
   * @param {object} attachment
   */
  async onVideoHandler(context, attachment) {
    try {
      log(`${this.botName}.onVideoHandler!`);
      log('attachment', attachment);
    } catch (error) {
      log(`Error ${this.botName}.onVideoHandler`, error);
    }
  }

  /**
   * Обработчик сообщения с файлом
   *
   * @param {object} context
   * @param {object} attachment
   */
  async onFileHandler(context, attachment) {
    try {
      log(`${this.botName}.onFileHandler!`);
      log('attachment', attachment);
    } catch (error) {
      log(`Error ${this.botName}.onFileHandler`, error);
    }
  }

  /**
   * Обработчик сообщения с гео-меткой
   *
   * @param {object} context
   * @param {object} attachment
   */
  async onGeoHandler(context, attachment) {
    try {
      log(`${this.botName}.onGeoHandler!`);
      log('attachment', attachment);
    } catch (error) {
      log(`Error ${this.botName}.onGeoHandler`, error);
    }
  }

  /**
   * Получение данных пользователя мессенджера
   *
   * @param {object} context
   *
   * @return {object} botUser
   */
  async getBotUser(context) {
    try {
      // запрос к API, для получения данных пользователя
      const userId = context.from_id;
      console.log('getBotUser',context)
      const { response ,req } = await this.bot.api('users.get', {
        user_ids: userId,
        access_token:  '88ef9bec0d2550d0c3735cd3c0d7f1b3f772b9ba6b75934f117dce825c681eb008adf82107a263388c92a'
      });
      console.log

      return response[0] || {};
    } catch (error) {
      log(`Error ${this.botName}.getBotUser`, error);
    }

    return false;
  }

  /**
   * Получение или регистрация пользователя
   *
   * @param {object} context
   * @param {string} startContext
   *
   * @return {object} user
   */
  async getUser(context, startContext = '') {
    try {
      log(`${this.botName}.getUser!`);

      const botUser = await this.getBotUser(context.message);
      let userName = botUser.first_name;

      userName += (botUser.last_name) ? ` ${botUser.last_name}` : '';

      // приведение данных к единому формату
      const userModel = {
        Name: userName,
        MessengerId: botUser.id.toString(),
        TenantName: this.params.TenantName,
        ApplicationId: this.params.ApplicationId,
      };
      const user = new User(this.botName);

      return await user.init(userModel, startContext);
    } catch (error) {
      log(`Error ${this.botName}.getUser`, error);
    }

    return false;
  }

  /**
   * Отправка сообщения в мессенджер
   *
   * @param {object} context
   * @param {string} text
   *
   * @return {Promise}
   */
  async botReply(context, text) {
    try {
      return context.reply(text);
    } catch (error) {
      log(`Error ${this.botName}.botReply`, error);
    }

    return false;
  }

  /**
   * Получение кнопки в личный кабинет
   * Заглушка для обратной совместимости
   *
   * @param {string} link
   * @param {string} text
   * @param {string} icon
   *
   * @return {string}
   */
  getButtonAccount(link, text = '', icon = '') {
    return link;
  }

  /**
   * Установка контроллера языковых сообщений
   *
   * @param {object} instance
   */
  setLangMessage(instance) {
    this.langMessage = instance;
  }

}
