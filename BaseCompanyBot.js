import log from "./log";
import utils from "./utils";
import http from './http';

export default class BaseCompanyBot {

  /**
   * @param {string} host
   * @param {object} params
   */
  constructor(host, params) {
    this.botName = 'base';
    this.user = null;
    this.langMessage = null;
    this.host = host;
    this.params = params;
  }

  /**
   * Инициализация
   */
  init() {}

  /**
   * Установка слушателей
   */
  setListeners() {}

  /**
   * Обработчик первоначального запуска бота
   *
   * @async
   */
  onStartCommand() {}

  /**
   * Обработчик команды "откуда ты"
   *
   * @param {object} context
   */
  async onWhereAreYouFromCommand(context) {
    try {
      this.botReply(context, JSON.stringify(process.env, null, 2));
    } catch (error) {
      log(`Error ${this.botName}.onWhereAreYouFromCommand`, error);
    }
  }


  async onCallMeCommand(context) {
    try {
      this.botReply(context, 'Thanks! You will be contacted back soon!');
    } catch (error) {
      log(`Error ${this.botName}.onCallMeCommand`, error);
    }
  }

  /**
   * Обработчик команды помощи
   *
   * @async
   */
  onHelpCommand() {}

  /**
   * Обработчик текстового сообщения
   *
   * @async
   */
  onTextMessageReceived() {}

  /**
   * Получение данных пользователя мессенджера
   *
   * @param {object} context
   *
   * @return {object} botUser
   */
  getBotUser(context) {}

  /**
   * Получение или регистрация пользователя
   *
   * @param {object} context
   * @param {string} startContext
   *
   * @return {object} user
   *
   * @async
   */
  getUser(context, startContext = '') {}

  /**
   * Регистрация сообщения пользователя
   *
   * @param {object} context
   * @param {string} text
   */
  async saveMessage(context, text) {
    try {
      log(`${this.botName}.saveMessage!`);

      const { response } = await utils.saveMessage(this.user, text);

      if (!response) {
        const messageNotDelivered = this.langMessage.messageWasNotDelivered();

        this.botReplyAndSave(context, messageNotDelivered, messageNotDelivered);
      }

      return response;
    } catch (error) {
      log(`Error ${this.botName}.saveMessage`, error);
    }

    return false;
  }

  /**
   * Регистрация сообщения от имени бота
   *
   * @param {object} context
   * @param {string} text
   */
  async saveMessageAsBot(context, text) {
    try {
      log(`${this.botName}.saveMessageAsBot!`);

      const { response } = await utils.saveMessageAsBot(this.user, text);

      return response;
    } catch (error) {
      log(`Error ${this.botName}.saveMessageAsBot`, error);
    }

    return false;
  }

  /**
   * Приветственное сообщение с ссылкой на ЛК
   * Сохранение сообщений от имени бота в БД
   *
   * @param {object} context
   *
   * @return {Promise}
   */
  async botReplyWelcome(context) {
    try {
      log(`${this.botName}.botReplyWelcome!`);
      // log('this!Application!');
      // log(this.user.application.Name);

      var res = [];
      const link = await this.user.getShortLink();
      const links = await this.user.getShortLinksForBotUser();

      const messageAccount = this.langMessage.myAccount();
      if(links.length > 1){
        var i = 0;
        for (const elementLink of links) {
          const buttonAccount = this.getButtonAccount(elementLink, messageAccount);
          const buttonAccountForBd = `<a href="${elementLink}" target="_blank">${messageAccount}</a>`;
          let messageWelcome = '';
          if (!this.user.isSubscribed()) {
            messageWelcome = this.langMessage.hello(this.user.getName());
          } else {
            messageWelcome = this.langMessage.welcomeBackInApp(this.user.getName());
          }
          messageWelcome = messageWelcome + "\n" + this.user.application.Name + "(" +this.user.data.ObjectIds[i]+ ")";
          await this.botReplyAndSave(context, messageWelcome, messageWelcome);
          // await this.botReplyAndSave(context, messageThanks, messageThanks);
          res = await this.botReplyAndSave(context, buttonAccount, buttonAccountForBd);
          i+=1;
        }
      }else{
        const buttonAccount = this.getButtonAccount(link, messageAccount);
        const buttonAccountForBd = `<a href="${link}" target="_blank">${messageAccount}</a>`;
        let messageWelcome = '';
        if (!this.user.isSubscribed()) {
          messageWelcome = this.langMessage.hello(this.user.getName());
        } else {
          messageWelcome = this.langMessage.welcomeBack(this.user.getName());
        }

        await this.botReplyAndSave(context, messageWelcome, messageWelcome);
        // await this.botReplyAndSave(context, messageThanks, messageThanks);
        res = await this.botReplyAndSave(context, buttonAccount, buttonAccountForBd);
      }

      return res;
    } catch (error) {
      log(`Error ${this.botName}.botReplyWelcome`, error);
    }
  }

  /**
   * Отправка сообщения в мессенджер
   * Сохранение сообщения от имени бота в БД
   *
   * @param {object} context
   * @param {string|object} text - сообщение для отправки в мессенджер
   * @param {string} textForBd - сообщение для отправки в БД
   *
   * @return {Promise}
   */
  async botReplyAndSave(context, text, textForBd) {
    // console.log('botReplyAndSave')
    // console.log(context)
    // console.log(text)
    try {
      const isSent = await this.botReply(context, text);
      //telegram is over here
      if (isSent) {
        return utils.saveMessageAsBot(this.user, textForBd);
      }
    } catch (error) {
      log(`Error ${this.botName}.botReplyAndSave`, error);
    }

    return false;
  }

  /**
   * Отправка сообщения в мессенджер
   *
   * @async
   */
  botReply(context, text) {
    console.log('botReply')
  }

  /**
   * Получение кнопки в личный кабинет
   *
   * @param {string} link
   * @param {string} text
   * @param {string} icon
   */
  getButtonAccount(link, text, icon = '') {}

  /**
   * Установка контроллера языковых сообщений
   *
   * @param {object} instance
   */
  setLangMessage(instance) {}

  /**
   * TODO
   * Статус отправленного ботом пользователю сообщения
   */
  botMessageStatus() {}

  /**
   * Проверка доступности функционала
   * В частности проверяется существование переменной user
   *
   * @return {boolean}
   */
  checkAccess() {
    if (!this.user) {
      throw new Error('Property "this.user" is not found!');
    }

    return true;
  }

  /**
   * Проверка валидности кода верификации
   *
   * @param {string} code
   *
   * @return {boolean}
   */
  codeValidate(code) {
    return /^\d{3}$/.test(code);
  }

}
