import log from './log';
import utils from './utils';

const Globalize = require('globalize');

Globalize.load(require('cldr-data').entireSupplemental());
Globalize.load(require('cldr-data').entireMainFor('en', 'ru'));
Globalize.loadMessages(require('./messages/en'));
Globalize.loadMessages(require('./messages/ru'));

export default class LangMessage {

  /**
   * @param {string} language
   */
  constructor(language = 'ru') {
    try {
      Globalize.locale(language);
      this.globalize = Globalize;
    } catch (error) {
      log('Error LangMessage.constructor', error)
    }
  }

  /**
   * @param {string} userName
   * @return {string}
   */
  firstMessage(userName) {
    let message = this.globalize.formatMessage('First message');

    message = utils.replaceSnippets(message, {
      USER_NAME: userName,
    });

    return message;
  }

  /**
   * @param {string} userName
   * @return {string}
   */
  hello(userName) {
    let message = this.globalize.formatMessage('Hello');

    message = utils.replaceSnippets(message, {
      USER_NAME: userName,
    });

    return message;
  }

  /**
   * @param {string} userName
   * @return {string}
   */
  welcomeBack(userName = '') {
    let message = this.globalize.formatMessage('Welcome back');

    message = utils.replaceSnippets(message, {
      USER_NAME: userName,
    });

    return message;
  }

  /**
   * @param {string} userName
   * @return {string}
   */
  welcomeBackInApp(userName = '') {
    let message = this.globalize.formatMessage('Welcome back in App');

    message = utils.replaceSnippets(message, {
      USER_NAME: userName,
    });

    return message;
  }

  /**
   * @return {string}
   */
  thanksForYourMessage() {
    return this.globalize.formatMessage('We have received your message and respond you ASAP. Press this button to enter your Account');
  }

  /**
   * @return {string}
   */
  myAccount() {
    return this.globalize.formatMessage('My Account');
  }

  /**
   * @param {string} userName
   * @param {string} botName
   * @return {string}
   */
  userJoinedSelfMessage(userName, botName) {
    let message = this.globalize.formatMessage('User joined');

    message = utils.replaceSnippets(message, {
      USER_NAME: userName,
      BOT_NAME: botName,
    });

    return message;
  }

  /**
   * @return {string}
   */
  messageWasNotDelivered() {
    return this.globalize.formatMessage('Your message was not delivered, ups... Try again');
  }

  /**
   * @return {string}
   */
  messageVerificationCodeError() {
    return this.globalize.formatMessage('Verification code error');
  }

}
