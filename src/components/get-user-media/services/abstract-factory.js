export class AbstractServiceFactory {
  constructor(config) {
    this._serviceConstructor = this.serviceConstructor(config)
  }

  serviceConstructor() {
    throw new Error('This is an abstract class, extend it to use it')
  }

  async getService() {
    return await this._serviceConstructor()
  }
}