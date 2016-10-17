/*jslint node: true */
'use strict';

var env = process.env;

//
// The configuration options of the server
//

/**
 * Configuration of access tokens.
 *
 * expiresIn - The time in seconds before the access token expires
 * calculateExpirationDate - A simple function to calculate the absolute
 * time that th token is going to expire in.
 * authorizationCodeLength - The length of the authorization code
 * accessTokenLength - The length of the access token
 * refreshTokenLength - The length of the refresh token
 */
exports.token = {
  expiresIn: 3600,
  calculateExpirationDate: function () {
    return new Date(new Date().getTime() + (this.expiresIn * 1000));
  },
  authorizationCodeLength: 16,
  accessTokenLength: 256,
  refreshTokenLength: 256
};


exports.session = {
  type: 'RedisStore',
  maxAge: 3600000 * 24 * 7 * 52,
  secret: env.SESSION_SECRET || 'A Secret That Should Be Changed'
};

exports.stapi = {
  url: env.STAPI || 'http://localhost:9000/api/smsoauth/'
};

exports.smsTrafficAPI = {
  login: env.SMS_LOGIN,
  password: env.SMS_PWD,
  originator: env.SMS_ORIGIN || 'Sistemium',
  uri: env.SMS_URI
};


exports.express = {
  port: env.PORT || 3000
};

exports.redis = {
  prefix: 'oa2sess:',
  db: parseInt(env.REDIS_DB || 5),
  host: env.REDIS_HOST,
  ttl: env.SESSION_TTL || 24 * 3600
};

exports.language = env.LANGUAGE || 'ru';
