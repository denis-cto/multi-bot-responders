import Telegraf from 'telegraf';
import SocksAgent from 'socks5-https-client/lib/Agent';
import log from '../log';
import utils from '../utils';
import BaseCompanyBot from '../BaseCompanyBot';
import User from '../User';

export default class CompanyBotTelegram extends BaseCompanyBot {

  /**
   * @param {string} host
   * @param {object} params
   */
  constructor(host, params) {
    try {
      super(host, params);

      log('CompanyBotTelegram!');

      this.botName = 'telegram';

      this.webhookUrl = `/bot/${this.params.port}/${this.params.EnvType}`;
      log('webhookUrl!',  this.webhookUrl );
      log('botName!',  this.botName );
      log('params!',  params );

      // this.proxy = {
      //   host: 'eu.company.com',
      //   port: 1080,
      //   username: 'user',
      //   password: 'user',
      // };
      // this.proxy = {
      //   host: 'proxysexy.online',
      //   port: 8512,
      //   username: 'proxy',
      //   password: 'sexy',
      // };
      this.proxy = {
        host: 'deimos.public.opennetwork.cc',
        port: 1090,
        username: '36925141',
        password: '5cg68tPq',
      };
      // this.proxy = {
      //   host: 'ryhjm.tgproxy.me',
      //   port: 1080,
      //   username: 'telegram',
      //   password: 'telegram',
      // };

      // var subDomen           = '';
      // var characters       = 'abcdefghijklmnopqrstuvwxyz';
      // var charactersLength = characters.length;
      // var length = 5;
      // for ( var i = 0; i < length; i++ ) {
      //   subDomen += characters.charAt(Math.floor(Math.random() * charactersLength));
      // }
      //
      // //var host =subDomen+'.teletype.live';
      // var host =subDomen+'.tgproxy.me';
      // log(`${host} used as proxy `);
      // this.proxy = {
      //   host: host,
      //   port: 1080,//443
      //   username: 'telegram',
      //   password: 'telegram',
      // };

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
      // const socksAgent = new SocksAgent({
      //   socksHost: this.proxy.host,
      //   socksPort: this.proxy.port,
      //   socksUsername: this.proxy.username,
      //   socksPassword: this.proxy.password,
      // });
      this.bot = new Telegraf(this.params.Token);
      //   , {
      //   telegram: {
      //     agent: socksAgent,
      //   }
      // });
      this.bot.params = this.params;

      log('bot', this.bot);

      this.bot.startWebhook(this.webhookUrl, null, this.params.port, '0.0.0.0');

      this.bot.telegram.setWebhook(`https://ee115348-admin.company.com${this.webhookUrl}`)
        .catch(error => {
          log(`Error ${this.botName} setWebhook`, error);
        });
      log('setWebhook', `https://ee115348-admin.company.com${this.webhookUrl}`);
      this.setListeners();
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
      this.bot.catch((error) => {
        log('Error!', error);
      });

      /**
       * Обработчик всех входящих сообщений
       */
      this.bot.on('message', async (context) => {
        log('context', context);

        const incomingText = context.message.text.toLowerCase().trim();
        let startContext = '';
        if (incomingText.match(/\/start/)) {
          startContext = incomingText.replace('/start', '').trim();
        }

        this.user = await this.getUser(context, startContext);

        context.updateSubTypes.forEach(type => {
          switch (type) {
            case 'text':
              switch (incomingText) {
                case '/start':
                  this.onStartCommand(context);
                  break;

                case '/whereareyoufrom':
                  this.onWhereAreYouFromCommand(context);
                  break;

                case '/help':
                  this.onHelpCommand(context);
                  break;

                default:
                  this.onTextMessageReceived(context);
                  break;
              }
              break;

            case 'sticker':
              this.onTextMessageReceived(context);
              break;

            case 'photo':
              this.onImageMessageReceived(context);
              break;

            case 'voice':
              // this.onAudioMessageReceived(context);
              break;

            case 'audio':
              this.onAudioMessageReceived(context);
              break;

            case 'video':
              this.onVideoMessageReceived(context);
              break;

            case 'document':
              // this.onFileMessageReceived(context, message);
              break;

            case 'location':
              this.onGeoMessageReceived(context);
              break;

            case 'contact':
              this.onContactMessageReceived(context);
              break;

            default:
              log(`Handler is not found! Type: ${type}`);
          }
        });
      });
    } catch (error) {
      log(`Error ${this.botName}.setListeners`, error);
    }
  }

  /**
   * Обработчик первоначального запуска бота
   *
   * @param {object} context
   */
  async onStartCommand(context) {
    try {
      log(`${this.botName}.onStartCommand`);

      if (this.checkAccess()) {
        const messageJoined = this.langMessage.userJoinedSelfMessage(this.user.getName(), this.botName);

        this.saveMessage(context, messageJoined);
        await this.botReplyWelcome(context);

        if (!this.user.isSubscribed()) {
          this.user.subscribe();
        }
      }
    } catch (error) {
      log(`Error .onStartCommand`, error);
    }
  }

  /**
   * Обработчик команды помощи
   *
   * @param {object} context
   */
  async onHelpCommand(context) {
    try {
      log(`${this.botName}.onHelpCommand`);

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
      log(`${this.botName}.onTextMessageReceived`);

      if (!this.checkAccess()) {
        return false;
      }

      const incomingText = context.message.text;

      // this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onTextMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с изображением
   *
   * @param {object} context
   */
  async onImageMessageReceived(context) {
    try {
      log(`${this.botName}.onImageMessageReceived`);

      const newContext = await this.downloadPhotoMiddleware(context);

      if (!this.checkAccess() || !newContext) {
        return false;
      }

      const incomingText = `<a href="${context.state.fileLink}"><img src="${newContext.state.thumbLink}" /></a>`;

      // this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onImageMessageReceived`, error);
    }
  }

  /**
   * ...
   *
   * @param {object} context
   *
   * @return {*}
   */
  async downloadPhotoMiddleware(context) {
    try {
      const link = await this.bot.telegram.getFileLink(context.message.photo[0]);

      if (link) {
        context.state.thumbLink = link;

        const numberOfPhotos = Object.keys(context.message.photo).length;

        //the last item is the largest file
        context.state.fileLink = await this.bot.telegram.getFileLink(context.message.photo[numberOfPhotos - 1]);
      }

      return context;
    } catch (error) {
      log(`Error ${this.botName}.downloadPhotoMiddleware`, error);
    }

    return false;
  }

  /**
   * Обработчик сообщения с аудио
   *
   * @param {object} context
   */
  async onAudioMessageReceived(context) {
    try {
      log(`${this.botName}.onAudioMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      const incomingText = `onAudioMessageReceived`;

      // this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onAudioMessageReceived`, error);
    }

  }

  /**
   * Обработчик сообщения с видео
   *
   * @param {object} context
   */
  async onVideoMessageReceived(context) {
    try {
      log(`${this.botName}.onVideoMessageReceived`);

      const newContext = await this.downloadVideoMiddleware(context);

      if (!this.checkAccess() || !newContext) {
        return false;
      }

      const incomingText = `<video width="320" height="240" controls poster="${newContext.state.thumbLink}"><source src="${newContext.state.fileLink}" type="video/mp4" /></video>`;

      // this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onVideoMessageReceived`, error);
    }
  }

  /**
   * ...
   *
   * @param {object} context
   *
   * @return {*}
   */
  async downloadVideoMiddleware(context) {
    try {
      log(`${this.botName}.downloadVideoMiddleware`);

      const link = await this.bot.telegram.getFileLink(context.message.video.thumb);

      if (link) {
        context.state.thumbLink = link;

        //the last item is the largest file
        context.state.fileLink = await this.bot.telegram.getFileLink(context.message.video);
      }

      return context;
    } catch (error) {
      log(`Error ${this.botName}.downloadVideoMiddleware`, error);
    }

    return false;
  }

  /**
   * Обработчик сообщения с гео-меткой
   *
   * @param {object} context
   */
  async onGeoMessageReceived(context) {
    try {
      log(`${this.botName}.onGeoMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      const incomingText = `onGeoMessageReceived`;

      // this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
    } catch (error) {
      log(`Error ${this.botName}.onGeoMessageReceived`, error);
    }
  }

  /**
   * Обработчик сообщения с контактом
   *
   * @param {object} context
   */
  async onContactMessageReceived(context) {
    try {
      log(`${this.botName}.onContactMessageReceived!`);

      if (!this.checkAccess()) {
        return false;
      }

      const incomingText = `onContactMessageReceived`;

      // this.saveMessage(context, incomingText);
      this.botReplyWelcome(context);
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
      return context.from || {};
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
      log(`${this.botName}.getUser`);

      const botUser = this.getBotUser(context);
      let userName = botUser.first_name;

      userName += (botUser.last_name) ? ` ${botUser.last_name}` : '';

      // приведение данных к единому формату
      const userModel = {
        Name: userName,
        MessengerId: botUser.id.toString(),
        TenantName: this.params.TenantName,
        ApplicationId: this.params.ApplicationId,
      };
      let user = new User(this.botName);

      user = await user.init(userModel, startContext);
      //user could be equal 'false'
      if (!user){
         user = new User(this.botName);
      }

      if (user.isEmptyObjects()) {
        await user.createEmptyObject();
      }

      return user;
    } catch (error) {
      log(`Error ${this.botName}.getUser`, error);
    }
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

      const link = await this.user.getShortLink();
      // const messageThanks = this.langMessage.thanksForYourMessage();
      const messageAccount = this.langMessage.myAccount();
      const buttonAccount = this.getButtonAccount(link, messageAccount);
      const buttonAccountForBd = `<a href="${link}" target="_blank">${messageAccount}</a>`;
      let messageWelcome = '';

      if (!this.user.isSubscribed()) {
        messageWelcome = this.langMessage.hello(this.user.getName());
      } else {
        messageWelcome = this.langMessage.welcomeBack(this.user.getName());
      }
      messageWelcome = `${messageWelcome} ${link}`
// /////// i'll put it out in same personal function after testing
       const { data: { MessengerId } } = this.user;
      // // log('update_id');
      // // log(MessengerId);
      // var subDomen           = '';
      // var characters       = 'abcdefghijklmnopqrstuvwxyz';
      // var charactersLength = characters.length;
      // var length = 5;
      // for ( var i = 0; i < length; i++ ) {
      //   subDomen += characters.charAt(Math.floor(Math.random() * charactersLength));
      // }
      // var host =subDomen+'.teletype.live';
      // //var host =subDomen+'.tgproxy.me';
      // //we'll could use rand of('.teletype.live','.tgproxy.me',443,1080)
      // log(`${host} used as proxy `);
      // this.proxy = {
      //   host: host,
      //   port: 443,//1080,//443,
      //   username: 'telegram',
      //   password: 'telegram',
      // };
      // const socksAgent = new SocksAgent({
      //   socksHost: this.proxy.host,
      //   socksPort: this.proxy.port,
      //   socksUsername: this.proxy.username,
      //   socksPassword: this.proxy.password,
      // });
      // this.bot = new Telegraf(this.params.Token
      //   , {
      //     telegram: {
      //       agent: socksAgent,
      //     }
      //   });
      // this.bot.params = this.params;
// //////////

      var res = await this.bot.telegram.sendMessage(MessengerId,
        messageWelcome
        /* ,
parse_mode	String,
disable_web_page_preview	Boolean	,
disable_notification	Boolean	,
reply_to_message_id	Integer	,
reply_markup	InlineKeyboardMarkup or ReplyKeyboardMarkup or ReplyKeyboardRemove or ForceReply
         */
      );
      log(res);

      await this.botReplyAndSave(context, messageWelcome, messageWelcome);
      // return this.botReplyAndSave(context, {
      //   text: messageThanks,
      //   extra: buttonAccount,
      // }, `${messageThanks}<br/>${buttonAccountForBd}`);
      return this.botReplyAndSave(context, {
        extra: buttonAccount,
      }, buttonAccountForBd);
    } catch (error) {
      log(`Error ${this.botName}.botReplyWelcome`, error);
    }
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
      if (typeof text === 'object') {
        const message = text.text || '';
        const extra = text.extra || {};

        return context.reply(message, extra);
      } else {
        return context.reply(text);
      }
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
      const MyAccountButton = {
        text: text,
        url: link,
      };

      return {
        reply_markup: JSON.stringify({
          inline_keyboard: [[MyAccountButton]],
        }),
      };
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

