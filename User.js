import _ from 'lodash';
import querystring from 'querystring';
import log from './log';
import http from './http';
import utils from './utils';
import { userModel } from './models';
import Application from './Application';

export default class User {

  /**
   * @param {string} botName
   */
  constructor(botName) {
    this.botName = botName;
    this.startContext = '';
    this.data = {};
    this.application = null;
    this.shortLink = '';
    this.userGetUrl = `/v5/${this.botName}users/messengerid`;
    this.userCreateUpdateUrl = `/v5/${this.botName}users/createupdate`;
    this.shortLinkUrl = '/v5/objects/shortlink';

    this.shortLinks = [];
  }

  /**
   * Инициализация
   *
   * @param {object} userModel
   * @param {string} startContext
   *
   * @return {this}
   */
  async init(userModel, startContext) {
    try {
      log('User.init!');

      this.startContext = startContext;

      log('startContext is');
      log(startContext);

      this.data = User.sanitize(userModel);
       // log('ApplicationId '+this.data.ApplicationId);
       // log('data '+this.data);
       // log(this.data);
      this.application = new Application(this.data.ApplicationId);
      this.application = await this.application.get();
      // log('application '+this.application);
      // log(this.application);
      if (!this.application) {
        log('Application is not found!');
        return false;//whath????
      }

      // попытка получить пользователя, если он уже создан
      const isExist = await this.getActualData();

      if (isExist) {
        log('User exist', isExist);
      }

      // обновление данных из контекста, при необходимости
      const isContextSaved = await this.startContextHandler();

      if (isContextSaved) {
        log('User context saved', isContextSaved);
      } else {
        log('User context not saved');
      }

      // обноавление/создание пользователя в БД
      const isUserSaved = await this.save();

      if (isUserSaved) {
        log('User created without binding to the object', isUserSaved);
        return this;
      }
    } catch (error) {
      log('Error User.init', error);
    }

    return false;
  }

  /**
   * Обработчик стартового контекста (токена)
   *
   * @return {Promise}
   */
  async startContextHandler() {
    log('start startContextHandler');
    try {
      if (this.startContext) {
        const startContext = await utils.decryptStartContextToObjectId(this);
        log('startContext is');
        log(startContext);
        if (startContext == 'false' || !startContext){
          log('startContextHandler - false !startContext');
          return false;
        }
        const { objectIds,applicationId,tenant } = startContext;
        log('objectIds is');
        log(objectIds);
        log('applicationId is');
        log(applicationId);
        log('tenant is');
        log(tenant);
        this.data.applicationId = applicationId;
        this.data.tenant = tenant;
        return this.setObjectIds(objectIds);
        //& this.setTenant(tenant);
        //& this.setApplicationId,(applicationId);
      }
    } catch (error) {
      log('Error User.startContextHandler', error);
    }
    log('startContextHandler - false');
    return false;
  }

  /**
   * Создание для пользователя пустого объекта и связка с ним
   *
   * @return {Promise}
   */
  async createEmptyObject() {
    log('start createEmptyObject');
    try {
      // если у пользователя нет объектов и у приложения настроена возможность создания объектов
      if (this.isEmptyObjects() && this.application.CreateObjects === 1) {
        const objectId = await utils.createEmptyObject(this);

        if (objectId) {
          await this.setObjectIds(objectId);
          const isUserSaved = await this.save();

          log('Is user saved with reference to empty object', isUserSaved);

          return isUserSaved;
        }
      }
    } catch (error) {
      log('Error User.createEmptyObject', error);
    }

    return false;
  }

  /**
   * Получение данных пользователя из БД
   * и актуализация текущих данных
   *
   * @return {object} data
   */
  async getActualData() {
    try {
      const params = {
        MessengerId: this.data.MessengerId,
        TenantName: this.data.TenantName,
        ApplicationId: this.data.ApplicationId,
      };
      const { data } = await http(process.env.NODE_ENV).post(this.userGetUrl, querystring.stringify(params));

      if (data && _.isArray(data) && data.length) {
        Object.assign(this.data, data[0]);
        // this.data = data[0];
        await this.dataConvertFromBd();

        return this.data;
      }
    } catch (error) {
      log('Error User.getActualData', error);
    }

    return false;
  }

  /**
   * Сохранение/обновление пользователя в БД
   *
   * @return {object} data
   */
  async save() {
    try {
      log('User.save!');

      await this.dataConvertToBd();

      const params = {
        create: JSON.stringify({
          MessengerId: this.data.MessengerId,
        }),
        update: JSON.stringify(User.sanitize(this.data)),
      };
      const { data } = await http(process.env.NODE_ENV).post(this.userCreateUpdateUrl, querystring.stringify(params));

      if (data.data && _.isArray(data.data)) {
        this.data = data.data[0];
        await this.dataConvertFromBd();

        return this.data;
      }
      else
      {
        console.log('Error saving user',data);
      }
    } catch (error) {
      log('Error User.save', error);
    }

    return false;
  }

  /**
   * Преобразование данных в формат для БД
   * костыли для корректной записи в БД
   *
   * @return {boolean}
   */
  async dataConvertToBd() {
    try {
      // this.data.MessengerId = this.data.MessengerId.toString();
      if (this.data.ObjectIds) {
        this.data.ObjectIds = JSON.stringify(this.data.ObjectIds);
      }
      this.data.Subscribed = JSON.stringify(this.data.Subscribed);

      return true;
    } catch (error) {
      log('Error User.dataConvertToBd', error);
    }

    return false;
  }

  /**
   * Преобразование данных из БД
   * обратные костыли
   *
   * @return {boolean}
   */
  async dataConvertFromBd() {
    try {
      if (this.data.ObjectIds) {
        this.data.ObjectIds = JSON.parse(this.data.ObjectIds);
      }
      this.data.Subscribed = JSON.parse(this.data.Subscribed);

      return true;
    } catch (error) {
      log('Error User.dataConvertFromBd', error);
    }

    return false;
  }

  /**
   * Проверка наличия объектов у пользователя
   *
   * @return {boolean}
   */
  isEmptyObjects() {
    return (
      !this.data.ObjectIds
      || (_.isArray(this.data.ObjectIds) && !this.data.ObjectIds.length)
    );
  }

  /**
   * Добавление новых id объекта
   *
   * @param {array|number} data
   * @param {boolean} force
   *
   * @return {array} ObjectIds
   */
  async setObjectIds(data, force = false) {
    try {
      log('start setObjectIds');
      if (!_.isArray(data)) {
        data = [data];
      }
      log('data is');
      log(data);
      if (force || this.isEmptyObjects()) {
        this.data.ObjectIds = data;
        this.data.ObjectId = data[0];
      } else {
        data.forEach(id => {
          if (!this.data.ObjectIds.includes(id)) {
            this.data.ObjectIds.push(id);
            this.data.ObjectId = id;
          }
        });
      }

      return this.data.ObjectIds;
    } catch (error) {
      log('Error User.setObjectIds', error);
    }

    return false;
  }

  /**
   * Изменение статуса подписки пользователя
   * и сохранение в БД
   */
  async subscribe() {
    this.data.Subscribed = true;

    return this.save();
  }

  /**
   * Проверка подписан ли пользователь
   */
  isSubscribed() {
    return this.data.Subscribed;
  }
  // /**
  //  * Проверка empty of object data
  //  */
  // isEmptyObjects() {
  //   return this.data == {};
  // }

  /**
   * Получение id приложения
   */
  getApplicationId() {
    return this.data.ApplicationId;
  }

  /**
   * Получение id пользователя в мессенджере
   */
  getMessengerId() {
    return this.data.MessengerId;
  }

  /**
   * Получение имени пользователя
   */
  getName() {
    return this.data.Name;
  }




  /**
   * Получение короткой ссылки на приложение
   *
   * @return {string}
   */
  async getShortLinksForBotUser() {

    var shortLinksArr = [];
    this.shortLinkUrlForBotUser = '/v5/objects/shortlinks';
    console.log('INSIDE getShortLinksForBotUser');
    console.log(this)
    if (this.data.ObjectIds.length > 1) {

      for (const element of this.data.ObjectIds) {
        var { data } = await http(process.env.NODE_ENV).get(`${this.shortLinkUrlForBotUser}?ApplicationId=${this.data.ApplicationId}&ObjectId=${element}&source=chatbot`);
        this.shortLinks.push(data.response);
        shortLinksArr.push(data.response);
        //  shortLinksArr.push({'elementLink':data.response,'element':element});
      }


    }
    return shortLinksArr;
  }

  /**
   * Получение короткой ссылки на приложение
   *
   * @return {string}
   */
  async getShortLink() {
    if (this.shortLink !== '') {
      return this.shortLink;
    }
console.log('INSIDE getShortLink');
    console.log(this)
    const { data } = await http(process.env.NODE_ENV).get(`${this.shortLinkUrl}?ApplicationId=${this.data.ApplicationId}&ObjectId=${this.data.ObjectId}&source=chatbot`);

    this.shortLink = data.response || '';

    return this.shortLink;
  }

  /**
   * Очистка данных, которых нет в эталонной модели
   *
   * @param {object} data
   *
   * @return {object}
   */
  static sanitize(data = {}) {
    try {
      const model = userModel;                                // load model default fields

      data = _.pick(_.defaults(data, model), _.keys(model));  // removes data that is not in model
      data = _.omitBy(data, _.isNil);                         // remove null and undefined values

      return data;
    } catch (error) {
      log('Error User.sanitize', error);
    }

    return false;
  }
}
