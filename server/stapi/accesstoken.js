/*jslint node: true */
/*global exports */
'use strict';

var stapi = require('./abstract.model.js');

module.exports = stapi('accessToken');

//The access tokens.
//You will use these to access your end point data through the means outlined
//in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
//(http://tools.ietf.org/html/rfc6750)
var accessToken = require('./init.js').accessToken;

/**
 * Returns an access token if it finds one, otherwise returns
 * null if one is not found.
 * @param key The key to the access token
 * @param done The function to call next
 * @returns The access token if found, otherwise returns null
 */
exports.find = function (key, done) {
  accessToken.find({access: key})
    .then(function(res){

    })
    .catch(function(res){

    });
};

/**
 * Saves a access token, expiration date, user id, client id, and scope.
 * @param token The access token (required)
 * @param expirationDate The expiration of the access token that is a javascript Date() object (required)
 * @param userID The user ID (required)
 * @param clientID The client ID (required)
 * @param scope The scope (optional)
 * @param done Calls this with null always
 * @returns returns this with null
 */
exports.save = function (token, expirationDate, userID, clientID, scope, done) {
  accessToken.getCollection(function (collection) {
    collection.insert({
      token: token,
      userID: userID,
      expirationDate: expirationDate,
      clientID: clientID,
      scope: scope
    }, function (err, inserted) {
      if (err) {
        return done(err);
      } else {
        return done(null);
      }
    });
  });
};

/**
 * Deletes an access token
 * @param key The access token to delete
 * @param done returns this when done
 */
exports.delete = function (key, done) {
  accessToken.getCollection(function (collection) {
    collection.remove({
      token: key
    }, function (err, result) {
      if (err) {
        return done(err, result);
      } else {
        return done(null, result);
      }
    });
  });
};

/**
 * Removes expired access tokens.  It does this by looping through them all
 * and then removing the expired ones it finds.
 * @param done returns this when done.
 * @returns done
 */
exports.removeExpired = function (done) {
  accessToken.getCollection(function (collection) {
    collection.find().each(function (err, token) {
      if (token !== null) {
        if (new Date() > token.expirationDate) {
          collection.remove({
            token: token
          }, function (err, result) {
          });
        }
      }
    });
  });
  return done(null);
};

/**
 * Removes all access tokens.
 * @param done returns this when done.
 */
exports.removeAll = function (done) {
  accessToken.getCollection(function (collection) {
    collection.remove(function (err, result) {
    });
    return done(null);
  });
};
