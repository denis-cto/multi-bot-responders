import log from './log';
import http from './http';

export default class Application {

  /**
   * @param {number} id
   */
  constructor(id) {
    this.applicationId = id;
    this.applicationUrl = '/v4/applications';
    this.CreateObjects = null;
  }

  /**
   * ...
   */
  async get(envName='') {
    try {
      const endpoint = `${this.applicationUrl}/${this.applicationId}`;
      const response = await http(envName).get(endpoint);
      console.log(response.data)
      if (response.data === false) {
        log('Application not exists');
      }

      return Object.assign(this, response.data);
    } catch (error) {
      log('Error Application.get', error);
    }

    return false;
  }

}
