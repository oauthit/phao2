/*jslint node: true */
/*global exports */
'use strict';

const stapi = require('../stapi/abstract.model.js');
const AccessToken = stapi('accessToken');
const Client = stapi('client');
const debug = require('debug')('oauth2orize:controllers:token');

/**
 * This endpoint is for verifying a token.  This has the same signature to
 * Google's token verification system from:
 * https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
 *
 * You call it like so
 * https://localhost:3000/api/tokeninfo?access_token=someToken
 *
 * If the token is valid you get returned
 * {
 *   "audience": someClientId
 * }
 *
 * If the token is not valid you get a 400 Status and this returned
 * {
 *   "error": "invalid_token"
 * }
 */
exports.info = [
  function (req, res) {
    debug(req.query);
    if (req.query.access_token) {
      AccessToken(req).findOne({code: req.query.access_token}).then(function (token) {
        if (!token) {
          res.status(400);
          res.json({error: 'invalid_token'});
        } else if (new Date() > token.expirationDate) {
          res.status(400);
          res.json({error: 'invalid_token'});
        }
        else {
          debug('token:', token);
          Client(req).findById(token.clientId).then(function (client) {
            if (!client) {
              res.status(400);
              res.json({error: 'invalid_token'});
            } else {
              if (token.expirationDate) {
                const expirationDate = new Date(token.expirationDate + 'Z');
                const expirationLeft = Math.floor((expirationDate.getTime() - new Date().getTime()) / 1000);
                if (expirationLeft <= 0) {
                  res.json({error: 'invalid_token'});
                } else {
                  res.json({audience: client.clientId, expires_in: expirationLeft});
                }
              } else {
                res.json({audience: client.clientId});
              }
            }
          }).catch(err => {
            console.log('error:', err);
            res.status(400);
            res.json({error: 'invalid_token'});
          });
        }
      }).catch(err => {
        console.log('error:', err);
        res.status(400);
        res.json({error: 'invalid_token'});
      });
    } else {
      res.status(400);
      res.json({error: 'invalid_token'});
    }
  }
];
