import vb from 'viber-bot';
import winston from 'winston';
import toYAML from 'winston-console-formatter';
import server from 'http';
import log from '../log';
import utils from '../utils';
import BaseCompanyBot from '../BaseCompanyBot';
import User from '../User';

const ViberBot = vb.Bot;
const BotEvents = vb.Events;
const TextMessage = vb.Message.Text;
const RichMediaMessage = vb.Message.RichMedia;

function createLogger() {
  const logger = new winston.Logger({
    level: "debug"
  }); // We recommend DEBUG for development
  logger.add(winston.transports.Console, toYAML.config());
  return logger;
}

export default class CompanyBotViber extends BaseCompanyBot {

  /**
   * @param {string} host
   * @param {object} params
   */
  constructor(host, params) {
    try {
      super(host, params);

      log('CompanyBotViber!');

      process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY = params.Token;

      this.botName = 'viber';
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
      this.bot = new ViberBot({
        logger: createLogger(),
        path: this.webhookUrl,
        authToken: this.params.Token,
        name: this.params.BotName,
        avatar: this.params.BotIcon,
      });

      this.setListeners();

      server
        .createServer(this.bot.middleware())
        .listen(this.params.port, () => {
          this.bot.setWebhook(`https://${this.host}${this.webhookUrl}`)
            .catch(error => {
              log(`Error ${this.botName} setWebhook`, error);
            });
        });
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
      this.bot.onError((error) => {
        log('Error!', error);
      });

      /**
       * Обработчик первого входа в приложение
       */
      this.bot.onConversationStarted(async (userProfile, isSubscribed, startContext, onFinish) => {
        // приведение к единому формату
        const context = {
          userProfile,
        };

        this.user = await this.getUser(context, startContext);

        this.onStartCommand(context, isSubscribed);
      });

      /**
       * Обработчик всех входящих сообщений
       */
      this.bot.on(BotEvents.MESSAGE_RECEIVED, async (message, context) => {
        const type = message.toJson().type;

        this.user = await this.getUser(context);

        switch (type) {
          case 'text':
            const incomingText = message.text.toLowerCase().trim();

            switch (incomingText) {
              case '/whereareyoufrom':
                this.onWhereAreYouFromCommand(context);
                break;

              case '/help':
                this.onHelpCommand(context);
                break;

              default:
                await this.onTextMessageReceived(context, message);
                break;
            }
            break;

          case 'picture':
            await this.onImageMessageReceived(context, message);
            break;

          case 'video':
            await this.onVideoMessageReceived(context, message);
            break;

          case 'file':
            await this.onFileMessageReceived(context, message);
            break;

          case 'location':
            await this.onGeoMessageReceived(context, message);
            break;

          case 'contact':
            await this.onContactMessageReceived(context, message);
            break;

          default:
            log(`Handler is not found! Type: ${type}`);
        }

        if (this.checkAccess() && !this.user.isSubscribed()) {
          this.user.subscribe();
        }
      });
    } catch (error) {
      log(`Error ${this.botName}.setListeners`, error);
    }
  }

  /**
   * Обработчик первоначального запуска бота
   *
   * @param {object} context
   * @param {boolean} isSubscribed
   */
  async onStartCommand(context, isSubscribed) {
    try {
      log(`${this.botName}.onStartCommand!`);

      if (!this.checkAccess()) {
        return false;
      }

      if (!isSubscribed) {
        const messageFirst = this.langMessage.firstMessage(this.user.getName());
        const messageJoined = this.langMessage.userJoinedSelfMessage(this.user.getName(), this.botName);

        this.saveMessage(context, messageJoined);
        this.botReply(context, messageFirst);
      } else {
        this.botReplyWelcome(context);
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

      this.botReply(context, [
        new TextMessage('This'),
        new TextMessage('is'),
        new TextMessage('help'),
        new TextMessage('message'),
      ]);
    } catch (error) {
      log(`Error ${this.botName}.onHelpCommand`, error);
    }
  }

  /**
   * Обработчик текстового сообщения
   *
   * @param {object} context
   * @param {object} message
   */
  async onTextMessageReceived(context, message) {
    try {
      log(`${this.botName}.onTextMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      const incomingText = message.text;

      // если сообщение содержит ссылку, то игнорируем его
      // костыль для предотвращения дублирующего ответа на переходы по ссылкам
      if (/^https:.+$/i.test(incomingText)) {
        return false;
      }

      this.saveMessage(context, incomingText);
      return this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onTextMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с изображением
   *
   * @param {object} context
   * @param {object} message
   */
  async onImageMessageReceived(context, message) {
    try {
      log(`${this.botName}.onImageMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      // const incomingText = `<a href="${message.toJson().media}"><img src="${message.toJson().thumbnail}" /></a>`;

      // this.saveMessage(context, incomingText);
      return this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onImageMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с видео
   *
   * @param {object} context
   * @param {object} message
   */
  async onVideoMessageReceived(context, message) {
    try {
      log(`${this.botName}.onVideoMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      // const incomingText = `<video width="320" height="240" controls poster="${message.toJson().thumbnail}"><source src="${message.toJson().media}" type="video/mp4" /></video>`;

      // this.saveMessage(context, incomingText);
      return this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onVideoMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с другим файлом
   *
   * @param {object} context
   * @param {object} message
   */
  async onFileMessageReceived(context, message) {
    try {
      log(`${this.botName}.onFileMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      // const incomingText = `<a href="${message.toJson().media}">${message.toJson().file_name}</a>`;

      // this.saveMessage(context, incomingText);
      return this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onFileMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с гео-меткой
   *
   * @param {object} context
   * @param {object} message
   */
  async onGeoMessageReceived(context, message) {
    try {
      log(`${this.botName}.onGeoMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      return this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onGeoMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с контактом
   *
   * @param {object} context
   * @param {object} message
   */
  async onContactMessageReceived(context, message) {
    try {
      log(`${this.botName}.onContactMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      return this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onContactMessageReceived`, error);
    }
  }

  /**
   * Получение данных пользователя мессенджера
   *
   * @param {object} context
   *
   * @return {object} botUser
   */
  getBotUser(context) {
    try {
      return context.userProfile || {};
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

      const botUser = this.getBotUser(context);

      // приведение данных к единому формату
      const userModel = {
        Name: botUser.name,
        MessengerId: botUser.id,
        TenantName: this.params.TenantName,
        ApplicationId: this.params.ApplicationId,
      };
      let user = new User(this.botName);

      user = await user.init(userModel, startContext);

      if (user.isEmptyObjects()) {
        await user.createEmptyObject();
      }

      return user;
    } catch (error) {
      log(`Error ${this.botName}.getUser`, error);
    }

    return false;
  }

  /**
   * Отправка сообщения в мессенджер
   *
   * @param {object} context
   * @param {string|object} text
   *
   * @return {Promise}
   */
  async botReply(context, text) {
    try {
      const botUser = this.getBotUser(context);

      // бот не принимает простые типы, поэтому конвертируем в необходимый формат
      // TODO: проверка на типы
      if (typeof text !== 'object') {
        text = new TextMessage(text);
      }

      return this.bot.sendMessage(botUser, text);
    } catch (error) {
      log(`Error ${this.botName}.botReply`, error);
    }

    return false;
  }

  /**
   * Получение кнопки в личный кабинет
   *
   * @param {string} link
   * @param {string} text
   * @param {string} icon
   *
   * @return {object}
   */
  getButtonAccount(link, text, icon = '') {
    try {
      const SAMPLE_RICH_MEDIA = {
        'ButtonsGroupColumns': 6,
        'ButtonsGroupRows': 1,
        'BgColor': '#FFFFFF',
        'Buttons': [
          {
            'ActionBody': link,
            'ActionType': 'open-url',
            'BgColor': '#85bb65',
            'Text': text,
            'TextOpacity': 60,
            'Rows': 1,
            'Columns': 6,
          },
        ],
      };

      return new RichMediaMessage(SAMPLE_RICH_MEDIA);
    } catch (error) {
      log(`Error ${this.botName}.getButtonAccount`, error);
    }

    return false;
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
