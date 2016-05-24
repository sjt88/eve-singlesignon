'use strict';

import * as pkg from '../package';
import { stringify as querystringify } from 'querystring';
import { default as request } from 'request-promise';

/**
 * Lists the available servers
**/
export const SERVERS = {
  tranqulity: 'https://login.eveonline.com',
  sisi: 'https://sisilogin.testeveonline.com'
};

/**
 *
*/
export class SingleSignOn {

  /**
   * Create a new instance of the SingleSignOn class with the given properties set
  **/
  constructor(client_id = null, secret_key = null, redirect_uri = null, options = {}, server = SERVERS.tranqulity) {

    if(client_id === null)
      throw new TypeError('client id can not be null');
    if(secret_key === null)
      throw new TypeError('secret can not be null');
    if(redirect_uri === null)
      throw new TypeError('redirect uri can not be null');

    this._client_id = client_id;
    this._secret_key = secret_key;
    this._redirect_uri = redirect_uri;
    this._server = server;
    this._options = options;

    if(!this._options.useragent) this._options.useragent = pkg.name + '/' + pkg.version + ' - nodejs/' + process.version + ' - ' + pkg.homepage;

  }

  /**
   *
  **/
  getRedirectUrl(state = null, scope = null) {

    let options = {
      'response_type': 'code',
      'client_id': this._client_id,
      'redirect_uri': this._redirect_uri
    };

    if(scope !== null) options.scope = scope;
    if(state !== null) options.state = state;

    return this._server + '/oauth/authorize/?' + querystringify(options);
  }

  /**
   *
  **/
  getAccessToken(code, refresh_token = false) {
    let options = {
      method: 'POST',
      simple: false,
      uri: this._server + '/oauth/token',
      headers: {
        'Authorization': 'Basic ' + (new Buffer(this._client_id + ':' + this._secret_key)).toString('base64')
      },
      form: {
        grant_type: (refresh_token) ? 'refresh_token' : 'authorization_code',
        code: code
      }
    };

    return this._request(options);
  }

  /**
   *
  **/
  verifyAccessToken(access_token) {
    let options = {
      method: 'GET',
      simple: false,
      uri: this._server + '/oauth/verify',
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    };

    return this._request(options);
  }

  /**
   *
  **/
  _request(options) {
    return new Promise((resolve, reject) => {
      request(options)
        .then((result) => {
          result = JSON.parse(result);
          if(result.error) return reject(new Error('SSO Error: ' + result.error + ' (' + result.error_description + ')'));
          return resolve(result);
        })
        .catch(reject);
    });
  }
}
